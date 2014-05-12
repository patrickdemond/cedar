<?php
/**
 * assignment_report.class.php
 * 
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\pull;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Consent form report data.
 * 
 * @abstract
 */
class assignment_report extends \cenozo\ui\pull\base_report
{
  /**
   * Constructor
   * 
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string $subject The subject to retrieve the primary information from.
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'assignment', $args );
  }

  /**
   * Builds the report.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $assignment_class_name = lib::get_class_name( 'database\assignment' );
    $event_type_class_name = lib::get_class_name( 'database\event_type' );
    $participant_class_name = lib::get_class_name( 'database\participant' ); 
    $cohort_class_name = lib::get_class_name( 'database\cohort' );
    $role_class_name = lib::get_class_name( 'database\role' );
    $site_class_name = lib::get_class_name( 'database\site' );   
    $user_class_name = lib::get_class_name( 'database\user' );

    $restrict_start_date = $this->get_argument( 'restrict_start_date' );
    $restrict_end_date = $this->get_argument( 'restrict_end_date' );
    $now_datetime_obj = util::get_datetime_object();
    $start_datetime_obj = NULL;
    $end_datetime_obj = NULL;

    $restrict_site_id = $this->get_argument( 'restrict_site_id', 0 );
    $site_mod = lib::create( 'database\modifier' );
    if( $restrict_site_id )
      $site_mod->where( 'id', '=', $restrict_site_id );

    // get the total number of possible participants in each cohort 
    // with completed baseline interviews
    $base_cati_mod = lib::create( 'database\modifier' );
    $base_cati_mod->where( 'event.event_type_id', '=',
      $event_type_class_name::get_unique_record( 'name', 'completed (Baseline)' )->id );

    $base_comp_mod = lib::create( 'database\modifier' );
    $base_comp_mod->where( 'event.event_type_id', '=',
       $event_type_class_name::get_unique_record( 'name', 'completed (Baseline Site)' )->id );

    $cohort_list = array();
    $total_complete = array();
    $header = array( 'Year', 'Month' );
    foreach( $cohort_class_name::select() as $db_cohort )
    {
      $cohort_list[$db_cohort->name] = $db_cohort->id;
      $total_complete[$db_cohort->name] = 0;
      $header[] = ucwords( $db_cohort->name ) . ' Closed';
      $header[] = ucwords( $db_cohort->name ) . ' Open';
    }

    $total_available['tracking']      = $participant_class_name::count( $base_cati_mod );
    $total_available['comprehensive'] = $participant_class_name::count( $base_comp_mod );

    $footer = array( '--', '--', 'sum()', '--', 'sum()', '--' );

    // validate the dates
    if( $restrict_start_date )
    {
      $start_datetime_obj = util::get_datetime_object( $restrict_start_date );
      if( $start_datetime_obj > $now_datetime_obj )
        $start_datetime_obj = clone $now_datetime_obj;
    }
    if( $restrict_end_date )
    {
      $end_datetime_obj = util::get_datetime_object( $restrict_end_date );
      if( $end_datetime_obj > $now_datetime_obj )
        $end_datetime_obj = clone $now_datetime_obj;
    }

    if( $restrict_start_date && $restrict_end_date && $end_datetime_obj < $start_datetime_obj )
    {
      $temp_datetime_obj = clone $start_datetime_obj;
      $start_datetime_obj = clone $end_datetime_obj;
      $end_datetime_obj = clone $temp_datetime_obj;
    }

    // if there is no start date then start with the earliest created assignment
    if( is_null( $start_datetime_obj ) )
    {
      $assignment_mod = lib::create( 'database\modifier' );
      $assignment_mod->order( 'start_datetime' );
      $assignment_mod->limit( 1 );        
      $db_assignment = current( $assignment_class_name::select( $assignment_mod ) );
      if( false !== $db_assignment )
        $start_datetime_obj = util::get_datetime_object( $db_assignment->start_datetime );
    }

    if( is_null( $end_datetime_obj ) )
    {
      $end_datetime_obj = clone $now_datetime_obj;
    }

    // we only care about what months have been selected, set days of month appropriately
    // such that the for loop below will include the start and end date's months
    $start_datetime_obj->setDate(
      $start_datetime_obj->format( 'Y' ),
      $start_datetime_obj->format( 'n' ),
      1 );
    $end_datetime_obj->setDate(
      $end_datetime_obj->format( 'Y' ),
      $end_datetime_obj->format( 'n' ),
      2 );
    
    $db_role = $role_class_name::get_unique_record( 'name', 'typist' );

    $site_list = $site_class_name::select( $site_mod );
    $do_summary_table = 1 < count( $site_list );
    $summary_content = array();

    // now create a table for every site included in the report
    foreach( $site_list as $db_site )
    {
      $title = $db_site->name . ' Assignments';

      // get all the typists from this site
      $id_list = array();
      $user_mod = lib::create( 'database\modifier' );
      $user_mod->where( 'access.role_id', '=', $db_role->id );
      $user_mod->where( 'access.site_id', '=', $db_site->id );
      foreach( $user_class_name::select( $user_mod ) as $db_user )
      {
        $id_list[] = $db_user->id;
      }

      // skip if no users at this site
      if( 0 == count( $id_list ) )
      {
        $this->add_table( $title, $header, array( '--','--', 0, '0', 0, '0' ), $footer );        
        continue;
      }

      $content = array();
      $interval = new \DateInterval( 'P1M' );
      for( $from_datetime_obj = clone $start_datetime_obj;
           $from_datetime_obj < $end_datetime_obj;
           $from_datetime_obj->add( $interval ) )
      {
        $to_datetime_obj = clone $from_datetime_obj;
        $to_datetime_obj->add( $interval );

        // set the year and month columns
        $row =
          array( $from_datetime_obj->format( 'Y' ), $from_datetime_obj->format( 'F' ) );

        $complete_mod = lib::create( 'database\modifier' );
        // get all adjudicated and completed assignments for this site's users
        $complete_mod->where( 'user_id', 'IN', $id_list );
        $complete_mod->where( 'end_datetime', '>=', $from_datetime_obj->format( 'Y-m-d' ) );
        $complete_mod->where( 'end_datetime', '<', $to_datetime_obj->format( 'Y-m-d' ) );
          
        $complete_list = array_fill_keys( array_keys( $cohort_list ), array() );
        foreach( $assignment_class_name::select( $complete_mod ) as $db_assignment )
        {
          // which cohort does this assignment pertain to?
          $db_participant = $db_assignment->get_participant();
          $cohort_name = $db_participant->get_cohort()->name;

          if( array_key_exists( $db_participant->id, $complete_list[$cohort_name] ) )
          {
            $complete_list[$cohort_name][$db_participant->id]++;
          }  
          else
          {
            $complete_list[$cohort_name][$db_participant->id] = 1;
          }
        }

        $in_progress_mod = lib::create( 'database\modifier' );
        $in_progress_mod->where( 'user_id', 'IN', $id_list );
        $in_progress_mod->where( 'start_datetime', '<', $to_datetime_obj->format( 'Y-m-d' ) );
        $in_progress_mod->where( 'end_datetime', '=', NULL );
        foreach( $cohort_list as $cohort_name => $cohort_id )
        {
          $complete_values =
            array_count_values( array_values( $complete_list[$cohort_name] ) );

          // number completed by two typists
          $num_complete = 
            array_key_exists( '2', $complete_values ) ? $complete_values['2'] : 0;
          // number completed by one typist
          $num_partial = 
            array_key_exists( '1', $complete_values ) ? $complete_values['1'] : 0;

          // number started but not completed
          $modifier = clone $in_progress_mod;
          $modifier->where( 'participant.cohort_id', '=', $cohort_id );
          $num_started = 0;
          foreach( $assignment_class_name::select( $modifier ) as $db_assignment )
          {
            if( !$db_assignment->all_tests_complete() ) $num_started++;
          }

          $row[] = $num_complete;
          $row[] = $num_partial + $num_started;
          $total_complete[ $cohort_name ] += $num_complete;
        }

        $content[] = $row;

        if( $do_summary_table )
        {
          $key = implode( array_slice( $row, 0, 2 ) );
          if( !array_key_exists( $key, $summary_content ) )
          {
            $summary_content[ $key ] = $row;
          }  
          else
          {
            for( $i = 2; $i < count( $row ); $i++ )
              $summary_content[ $key ][ $i ] += $row[ $i ];
          }
        }
      }

      $this->add_table( $title, $header, $content, $footer );
    }

    if( $do_summary_table )
    {
      $this->add_table( 'Summary (All Sites)',
        $header, array_values( $summary_content ), $footer );
    }
    
    $status_heading =  array( 'Cohort', 'Closed', 'Remaining' );
    $status_content = array();
    $status_footer =  array( '--', 'sum()', 'sum()' );

    foreach( $cohort_list as $cohort_name => $cohort_id )
    {
      $status_content[] =
        array( ucwords( $cohort_name ),
               $total_complete[$cohort_name],
               $total_available[$cohort_name] - $total_complete[$cohort_name] );
    }

    $this->add_table( 'Status (All Sites)',
      $status_heading, $status_content, $status_footer );
  }
}