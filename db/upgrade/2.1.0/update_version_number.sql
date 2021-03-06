DROP PROCEDURE IF EXISTS upgrade_application_number;
DELIMITER //
CREATE PROCEDURE upgrade_application_number()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Upgrading application version number" AS "";

    SET @sql = CONCAT(
      "UPDATE ", @cenozo, ".application ",
      "SET version = '2.1.0' ",
      "WHERE '", DATABASE(), "' LIKE CONCAT( '%_', name )" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL upgrade_application_number();
DROP PROCEDURE IF EXISTS upgrade_application_number;

SELECT "PLEASE NOTE: You must remove the application's cached schema file for changes to take effect" AS "";
