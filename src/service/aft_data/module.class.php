<?php
/**
 * module.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\aft_data;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Performs operations which effect how this module is used in a service
 */
class module extends \cedar\service\base_data_module
{
  /**
   * Extend parent method
   */
  public function prepare_read( $select, $modifier )
  {
    parent::prepare_read( $select, $modifier );

    $modifier->left_join( 'word', 'aft_data.word_id', 'word.id' );
    $modifier->left_join( 'language', 'word.language_id', 'language.id' );

    if( $select->has_column( 'word_type' ) )
    {
      $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
      $select->add_column(
        'IF( aft_data.word_id IS NULL, "placeholder", IFNULL( word.aft, "variant" ) )', 'word_type', false );
    }
  }
}
