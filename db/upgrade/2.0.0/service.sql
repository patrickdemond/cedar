SELECT "Creating new service table" AS "";

CREATE TABLE IF NOT EXISTS service(
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  method ENUM('DELETE','GET','PATCH','POST','PUT') NOT NULL,
  subject VARCHAR(45) NOT NULL,
  resource TINYINT(1) NOT NULL DEFAULT 0,
  restricted TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_method_subject_resource (method ASC, subject ASC, resource ASC))
ENGINE = InnoDB;

-- rebuild the service list
DELETE FROM service;
ALTER TABLE service AUTO_INCREMENT = 1;
INSERT INTO service ( subject, method, resource, restricted ) VALUES

-- framework services
( 'access', 'DELETE', 1, 1 ),
( 'access', 'GET', 0, 1 ),
( 'access', 'POST', 0, 1 ),
( 'activity', 'GET', 0, 1 ),
( 'address', 'DELETE', 1, 1 ),
( 'address', 'GET', 0, 0 ),
( 'address', 'GET', 1, 0 ),
( 'address', 'PATCH', 1, 0 ),
( 'address', 'POST', 0, 0 ),
( 'age_group', 'GET', 0, 0 ),
( 'application', 'GET', 0, 1 ),
( 'application', 'GET', 1, 0 ),
( 'application', 'PATCH', 1, 1 ),
( 'application_type', 'GET', 0, 0 ),
( 'application_type', 'GET', 1, 0 ),
( 'availability_type', 'DELETE', 1, 1 ),
( 'availability_type', 'GET', 0, 0 ),
( 'availability_type', 'GET', 1, 0 ),
( 'availability_type', 'PATCH', 1, 1 ),
( 'availability_type', 'POST', 0, 1 ),
( 'cohort', 'GET', 0, 0 ),
( 'collection', 'DELETE', 1, 1 ),
( 'collection', 'GET', 0, 0 ),
( 'collection', 'GET', 1, 1 ),
( 'collection', 'PATCH', 1, 1 ),
( 'collection', 'POST', 0, 1 ),
( 'consent', 'DELETE', 1, 1 ),
( 'consent', 'GET', 0, 0 ),
( 'consent', 'GET', 1, 0 ),
( 'consent', 'PATCH', 1, 1 ),
( 'consent', 'POST', 0, 1 ),
( 'consent_type', 'DELETE', 1, 1 ),
( 'consent_type', 'GET', 0, 0 ),
( 'consent_type', 'GET', 1, 0 ),
( 'consent_type', 'PATCH', 1, 1 ),
( 'consent_type', 'POST', 0, 1 ),
( 'event', 'DELETE', 1, 1 ),
( 'event', 'GET', 0, 0 ),
( 'event', 'GET', 1, 0 ),
( 'event', 'PATCH', 1, 1 ),
( 'event', 'POST', 0, 1 ),
( 'event_type', 'DELETE', 1, 1 ),
( 'event_type', 'GET', 0, 0 ),
( 'event_type', 'GET', 1, 0 ),
( 'event_type', 'PATCH', 1, 1 ),
( 'event_type', 'POST', 0, 1 ),
( 'export', 'DELETE', 1, 1 ),
( 'export', 'GET', 0, 1 ),
( 'export', 'GET', 1, 1 ),
( 'export', 'PATCH', 1, 1 ),
( 'export', 'POST', 0, 1 ),
( 'export_file', 'DELETE', 1, 1 ),
( 'export_file', 'GET', 0, 1 ),
( 'export_file', 'GET', 1, 1 ),
( 'export_file', 'PATCH', 1, 1 ),
( 'export_file', 'POST', 0, 1 ),
( 'export_column', 'DELETE', 1, 1 ),
( 'export_column', 'GET', 0, 1 ),
( 'export_column', 'GET', 1, 1 ),
( 'export_column', 'PATCH', 1, 1 ),
( 'export_column', 'POST', 0, 1 ),
( 'export_restriction', 'DELETE', 1, 1 ),
( 'export_restriction', 'GET', 0, 1 ),
( 'export_restriction', 'GET', 1, 1 ),
( 'export_restriction', 'PATCH', 1, 1 ),
( 'export_restriction', 'POST', 0, 1 ),
( 'language', 'GET', 0, 0 ),
( 'language', 'GET', 1, 0 ),
( 'language', 'PATCH', 1, 1 ),
( 'note', 'DELETE', 1, 1 ),
( 'note', 'GET', 0, 0 ),
( 'note', 'PATCH', 1, 1 ),
( 'note', 'POST', 0, 0 ),
( 'overview', 'GET', 0, 0 ),
( 'overview', 'GET', 1, 0 ),
( 'participant', 'GET', 0, 1 ),
( 'participant', 'GET', 1, 0 ),
( 'participant', 'PATCH', 1, 0 ),
( 'participant', 'POST', 0, 1 ),
( 'region', 'GET', 0, 0 ),
( 'region', 'GET', 1, 0 ),
( 'report', 'DELETE', 1, 1 ),
( 'report', 'GET', 0, 1 ),
( 'report', 'GET', 1, 1 ),
( 'report', 'PATCH', 1, 1 ),
( 'report', 'POST', 0, 1 ),
( 'report_restriction', 'DELETE', 1, 1 ),
( 'report_restriction', 'GET', 0, 1 ),
( 'report_restriction', 'GET', 1, 1 ),
( 'report_restriction', 'PATCH', 1, 1 ),
( 'report_restriction', 'POST', 0, 1 ),
( 'report_schedule', 'DELETE', 1, 1 ),
( 'report_schedule', 'GET', 0, 1 ),
( 'report_schedule', 'GET', 1, 1 ),
( 'report_schedule', 'PATCH', 1, 1 ),
( 'report_schedule', 'POST', 0, 1 ),
( 'report_type', 'GET', 0, 1 ),
( 'report_type', 'GET', 1, 1 ),
( 'report_type', 'PATCH', 1, 1 ),
( 'role', 'GET', 0, 0 ),
( 'search_result', 'GET', 0, 0 ),
( 'self', 'DELETE', 1, 0 ),
( 'self', 'GET', 1, 0 ),
( 'self', 'PATCH', 1, 0 ),
( 'self', 'POST', 1, 0 ),
( 'setting', 'GET', 0, 1 ),
( 'setting', 'GET', 1, 0 ),
( 'setting', 'PATCH', 1, 1 ),
( 'site', 'DELETE', 1, 1 ),
( 'site', 'GET', 0, 0 ),
( 'site', 'GET', 1, 1 ),
( 'site', 'PATCH', 1, 1 ),
( 'site', 'POST', 0, 1 ),
( 'state', 'DELETE', 1, 1 ),
( 'state', 'GET', 0, 0 ),
( 'state', 'GET', 1, 0 ),
( 'state', 'PATCH', 1, 1 ),
( 'state', 'POST', 0, 1 ),
( 'system_message', 'DELETE', 1, 1 ),
( 'system_message', 'GET', 0, 0 ),
( 'system_message', 'GET', 1, 1 ),
( 'system_message', 'PATCH', 1, 1 ),
( 'system_message', 'POST', 0, 1 ),
( 'user', 'DELETE', 1, 1 ),
( 'user', 'GET', 0, 0 ),
( 'user', 'GET', 1, 0 ),
( 'user', 'PATCH', 1, 1 ),
( 'user', 'POST', 0, 1 ),

-- application services
( 'aft_data', 'GET', 0, 0 ),
( 'aft_data', 'GET', 1, 0 ),
( 'aft_data', 'PATCH', 1, 1 ),
( 'defer_type', 'DELETE', 1, 1 ),
( 'defer_type', 'GET', 0, 0 ),
( 'defer_type', 'GET', 1, 1 ),
( 'defer_type', 'PATCH', 1, 1 ),
( 'defer_type', 'POST', 0, 1 ),
( 'mat_data', 'GET', 0, 0 ),
( 'mat_data', 'GET', 1, 0 ),
( 'mat_data', 'PATCH', 1, 1 ),
( 'rey1_data', 'GET', 0, 0 ),
( 'rey1_data', 'GET', 1, 0 ),
( 'rey1_data', 'PATCH', 1, 1 ),
( 'rey2_data', 'GET', 0, 0 ),
( 'rey2_data', 'GET', 1, 0 ),
( 'rey2_data', 'PATCH', 1, 1 ),
( 'sound_file', 'GET', 0, 0 ),
( 'sound_file', 'GET', 1, 0 ),
( 'test_entry', 'GET', 0, 0 ),
( 'test_entry', 'GET', 1, 0 ),
( 'test_entry', 'PATCH', 1, 0 ),
( 'test_entry_activity', 'GET', 0, 1 ),
( 'test_entry_activity', 'GET', 1, 1 ),
( 'test_type', 'GET', 0, 0 ),
( 'test_type', 'GET', 1, 1 ),
( 'test_type', 'PATCH', 1, 1 ),
( 'filename_format', 'DELETE', 1, 1 ),
( 'filename_format', 'GET', 0, 1 ),
( 'filename_format', 'GET', 1, 1 ),
( 'filename_format', 'POST', 0, 1 ),
( 'transcription', 'DELETE', 1, 1 ),
( 'transcription', 'GET', 0, 0 ),
( 'transcription', 'GET', 1, 0 ),
( 'transcription', 'PATCH', 1, 1 ),
( 'transcription', 'POST', 0, 0 );
