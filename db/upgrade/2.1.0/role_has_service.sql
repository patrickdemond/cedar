DROP PROCEDURE IF EXISTS patch_role_has_service;
DELIMITER //
CREATE PROCEDURE patch_role_has_service()
  BEGIN

    -- determine the @cenozo database name
    SET @cenozo = (
      SELECT DISTINCT REPLACE( unique_constraint_schema, "v1_", "" )
      FROM information_schema.referential_constraints
      WHERE constraint_schema IN( CONCAT( "v1_", DATABASE() ), DATABASE() )
      AND constraint_name = "fk_access_site_id" );

    SELECT "Creating new role_has_service table" AS "";

    SET @sql = CONCAT(
      "CREATE TABLE IF NOT EXISTS role_has_service ( ",
        "role_id INT UNSIGNED NOT NULL, ",
        "service_id INT UNSIGNED NOT NULL, ",
        "update_timestamp TIMESTAMP NOT NULL, ",
        "create_timestamp TIMESTAMP NOT NULL, ",
        "PRIMARY KEY (role_id, service_id), ",
        "INDEX fk_role_id (role_id ASC), ",
        "INDEX fk_service_id (service_id ASC), ",
        "CONSTRAINT fk_role_has_service_service_id ",
          "FOREIGN KEY (service_id) ",
          "REFERENCES service (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE NO ACTION, ",
        "CONSTRAINT fk_role_has_service_role_id ",
          "FOREIGN KEY (role_id) ",
          "REFERENCES ", @cenozo, ".role (id) ",
          "ON DELETE CASCADE ",
          "ON UPDATE NO ACTION) ",
      "ENGINE = InnoDB" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- populate table
    TRUNCATE role_has_service;

    -- administrator
    SET @sql = CONCAT(
      "INSERT INTO role_has_service( role_id, service_id ) ",
      "SELECT role.id, service.id ",
      "FROM ", @cenozo, ".role, service ",
      "WHERE role.name = 'administrator' ",
      "AND service.restricted = 1 ",
      "AND service.subject NOT LIKE '%_data'" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- typist
    SET @sql = CONCAT(
      "INSERT INTO role_has_service( role_id, service_id ) ",
      "SELECT role.id, service.id ",
      "FROM ", @cenozo, ".role, service ",
      "WHERE role.name IN( 'typist' ) ",
      "AND service.restricted = 1 ",
      "AND ( ",
        "service.subject LIKE '%_data' ",
        "OR service.subject = 'participant' ",
      ")" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- remove participant list from typist role
    SET @sql = CONCAT(
      "DELETE FROM role_has_service ",
      "WHERE role_id = ( SELECT id FROM ", @cenozo, ".role WHERE name = 'typist' ) ",
      "AND service_id = ( ",
        "SELECT id FROM service ",
        "WHERE subject = 'participant' AND method = 'GET' AND resource = 0",
      ")" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- supervisor
    SET @sql = CONCAT(
      "INSERT INTO role_has_service( role_id, service_id ) ",
      "SELECT role.id, service.id ",
      "FROM ", @cenozo, ".role, service ",
      "WHERE role.name = 'supervisor' ",
      "AND service.restricted = 1 ",
      "AND service.id NOT IN ( ",
        "SELECT id FROM service ",
        "WHERE subject IN( ",
          "'address', 'alternate', 'application', 'availability_type', 'collection', 'consent', 'consent_type', ",
          "'event', 'event_type', 'failed_login', 'filename_format', 'language', 'report_schedule', 'state', ",
          "'test_type' ) ",
        "OR subject LIKE '%_data' ",
        "OR ( subject = 'report_restriction' AND method IN( 'DELETE', 'PATCH', 'POST' ) ) ",
        "OR ( subject = 'report_type' AND method IN( 'DELETE', 'PATCH', 'POST' ) ) ",
        "OR ( subject = 'setting' AND method = 'GET' ) ",
        "OR ( subject = 'site' AND method IN ( 'DELETE', 'POST' ) ) ",
        "OR ( subject = 'word' AND method = 'POST' ) ",
      ")" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

    -- only tier > 1 can view collections
    SET @sql = CONCAT(
      "INSERT IGNORE INTO role_has_service( role_id, service_id ) ",
      "SELECT role.id, service.id ",
      "FROM service, ", @cenozo, ".role ",
      "JOIN ", @cenozo, ".application_type_has_role ",
        "ON role.id = application_type_has_role.role_id ",
      "JOIN ", @cenozo, ".application_type ",
        "ON application_type_has_role.application_type_id = application_type.id ",
        "AND application_type.name = 'cedar' ",
      "WHERE role.tier > 1 ",
      "AND service.restricted = 1 ",
      "AND service.subject = 'collection' ",
      "AND service.method = 'GET' ",
      "AND service.resource = 1" );
    PREPARE statement FROM @sql;
    EXECUTE statement;
    DEALLOCATE PREPARE statement;

  END //
DELIMITER ;

CALL patch_role_has_service();
DROP PROCEDURE IF EXISTS patch_role_has_service;
