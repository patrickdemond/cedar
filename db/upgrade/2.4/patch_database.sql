-- Patch to upgrade database to version 2.4

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE role_has_service.sql
SOURCE sound_file.sql
SOURCE report_type.sql
SOURCE application_type_has_report_type.sql
SOURCE role_has_report_type.sql
SOURCE report_restriction.sql
SOURCE status_type.sql
SOURCE test_type_has_status_type.sql
SOURCE test_entry.sql

SOURCE update_version_number.sql

COMMIT;
