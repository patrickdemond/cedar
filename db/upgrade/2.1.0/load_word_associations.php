#!/usr/bin/php
<?php
/**
 * This is a special script used when upgrading to version 2
 * This script should be run once after running patch_database.sql
 * It creates all homophone, sister and animal word associations.
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

ini_set( 'display_errors', '1' );
error_reporting( E_ALL | E_STRICT );
ini_set( 'date.timezone', 'US/Eastern' );

// utility functions
function out( $msg ) { printf( '%s: %s'."\n", date( 'Y-m-d H:i:s' ), $msg ); }
function error( $msg ) { out( sprintf( 'ERROR! %s', $msg ) ); }


class patch
{
  /**
   * Reads the framework and application settings
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function read_settings()
  {
    // include the initialization settings
    global $SETTINGS;
    require_once '../../../settings.ini.php';
    require_once '../../../settings.local.ini.php';
    require_once $SETTINGS['path']['CENOZO'].'/src/initial.class.php';
    $initial = new \cenozo\initial();
    $this->settings = $initial->get_settings();
  }

  public function connect_database()
  {
    $server = $this->settings['db']['server'];
    $username = $this->settings['db']['username'];
    $password = $this->settings['db']['password'];
    $name = $this->settings['db']['database_prefix'] . $this->settings['general']['instance_name'];
    $this->db = new \mysqli( $server, $username, $password, $name );
    if( $this->db->connect_error )
    {
      error( $this->db->connect_error );
      die();
    }
    $this->db->set_charset( 'utf8' );
  }

  /**
   * Executes the patch
   * 
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public function execute()
  {
    out( 'Reading configuration parameters' );
    $this->read_settings();

    out( 'Connecting to database' );
    $this->connect_database();

    out( 'Getting language primary keys' );
    $result = $this->db->query( sprintf(
      'SELECT id,code FROM %s.language', 
      $this->settings['db']['database_prefix'].$this->settings['general']['framework_name']
    ) );
    if( false === $result )
    {
      error( $this->db_error );
      die();
    }

    $language_list = array();
    foreach( $result as $row ) $language_list[$row['code']] = $row['id'];

    out( 'Creating animal associations' );
    $line = 1;
    try
    {
      foreach( file( 'animal_list.csv' ) as $string )
      {
        $error = false;
        $parts = explode( ',', str_replace( "\n", '', $string ) );
        if( 3 > count( $parts ) ) throw new Exception;

        // make sure code is enclosed by quotes and is seven consecutive integers delimited by a period (.)
        $code = $parts[0];
        if( !preg_match( '/^"([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)"$/', $code ) ) throw new Exception;
        $code = substr( $code, 1, -1 );

        $first = true;
        $current_language_id = NULL;
        $where_sql = '';
        for( $index = 1; $index < count( $parts ); $index++ )
        {
          // make sure all words are enclosed by quotes
          $string = $parts[$index];
          if( !preg_match( '/^"[^"]+"$/', $string ) ) throw new Exception;
          $string = substr( $string, 1, -1 );

          if( array_key_exists( $string, $language_list ) )
          {
            $current_language_id = $language_list[$string];
          }
          else
          {
            if( is_null( $current_language_id ) ) throw new Exception;
            $where_sql .= sprintf(
              '%s( language_id = %s AND word = "%s" )'."\n",
              $first ? '' : 'OR ',
              $current_language_id,
              $string
            );
            if( $first ) $first = false;
          }
        }

        $sql = sprintf(
          'UPDATE word'."\n".
          'SET word.animal_code = "%s"'."\n".
          'WHERE %s',
          $code,
          $where_sql
        );

        if( false === $this->db->query( $sql ) ) error( $this->db->error );
        $line++;
      }
    }
    catch( Exception $e )
    {
      error('Error while parsing line '.$line );
    }

    out( 'Creating sister associations' );
    $line = 1;
    try
    {
      foreach( file( 'sister_list.csv' ) as $string )
      {
        $error = false;
        $parts = explode( ',', str_replace( "\n", '', $string ) );
        if( 0 < count( $parts ) % 2 ) throw new Exception;

        if( 4 <= count( $parts ) )
        {
          $alt_list = array();
          for( $index = 0; $index < count( $parts ); $index+=2 )
          {
            // make sure all words are enclosed by quotes
            $language_code = $parts[$index];
            if( !preg_match( '/^"[^"]+"$/', $language_code ) ) throw new Exception;
            $language_id = $language_list[substr( $language_code, 1, -1 )];
            $word = $parts[$index+1];
            if( !preg_match( '/^"[^"]+"$/', $word ) ) throw new Exception;

            if( 0 == $index ) $base = array( 'language_id' => $language_id, 'word' => $word );
            else
            {
              if( !array_key_exists( $language_id, $alt_list ) ) $alt_list[$language_id] = array();
              $alt_list[$language_id][] = $word;
            }
          }

          $sql = sprintf(
            'UPDATE word, word AS sister_word'."\n".
            'SET word.sister_word_id = sister_word.id'."\n".
            'WHERE sister_word.language_id = %d AND sister_word.word = %s AND ('."\n",
            $base['language_id'],
            $base['word']
          );

          $first = true;
          foreach( $alt_list as $language_id => $word_list )
          {
            $sql .= sprintf( '  %s( word.language_id = %s AND word.word IN (%s) )'."\n",
                             $first ? '' : 'OR ',
                             $language_id,
                             implode( ',', $word_list ) );
            $first = false;
          }

          $sql .= ');'."\n";

          if( false === $this->db->query( $sql ) ) error( $this->db->error );
        }
        $line++;
      }
    }
    catch( Exception $e )
    {
      error('Error while parsing line '.$line );
    }

    out( 'Creating homophone associations' );
    if( false === $this->db->query( 'TRUNCATE homophone' ) ) error( $this->db->error );
    else
    {
      $line = 1;
      try
      {
        foreach( file( 'homophone_list.csv' ) as $string )
        {
          $error = false;
          $parts = explode( ',', str_replace( "\n", '', $string ) );
          if( 3 > count( $parts ) ) throw new Exception;

          // make sure all words are enclosed by quotes
          $language_code = array_shift( $parts ); // remove the language
          if( !preg_match( '/^"[^"]+"$/', $language_code ) ) throw new Exception;
          $language_id = $language_list[substr( $language_code, 1, -1 )];
          $first_word = $parts[0]; // note but do not remove the first word (it gets added below)
          if( !preg_match( '/^"[^"]+"$/', $first_word ) ) throw new Exception;

          $rank = 1;
          foreach( $parts as $word )
          {
            if( !preg_match( '/^"[^"]+"$/', $word ) ) throw new Exception;

            $sql = sprintf(
              'INSERT INTO homophone( first_word_id, word_id, rank )'."\n".
              'SELECT first_word.id, word.id, %d'."\n".
              'FROM word AS first_word, word'."\n".
              'WHERE first_word.language_id = %d'."\n".
              'AND first_word.language_id = word.language_id'."\n".
              'AND first_word.word = %s'."\n".
              'AND word.word = %s;'."\n",
              $rank,
              $language_id,
              $first_word,
              $word
            );

            if( false === $this->db->query( $sql ) )
            {
              error( $this->db->error );
              break;
            }

            $rank++;
          }
          $line++;
        }
      }
      catch( Exception $e )
      {
        error('Error while parsing line '.$line );
      }
    }

    out( 'Done' );
  }

  /**
   * Contains all initialization parameters.
   * @var array
   * @access private
   */
  private $settings = array();
}

$patch = new patch();
$patch->execute();
