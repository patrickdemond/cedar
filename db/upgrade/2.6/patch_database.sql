-- Patch to upgrade database to version 2.6

SET AUTOCOMMIT=0;

SOURCE service.sql
SOURCE role_has_service.sql
SOURCE jurisdiction.sql
SOURCE region_site.sql

SOURCE update_version_number.sql

COMMIT;
