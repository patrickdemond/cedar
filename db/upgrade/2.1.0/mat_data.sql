SELECT "Creating new mat_data table" AS "";

CREATE TABLE IF NOT EXISTS mat_data (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  update_timestamp TIMESTAMP NOT NULL,
  create_timestamp TIMESTAMP NOT NULL,
  test_entry_id INT UNSIGNED NOT NULL,
  rank INT UNSIGNED NOT NULL,
  value VARCHAR(5) NOT NULL,
  sequence_rank INT UNSIGNED NULL DEFAULT NULL COMMENT 'Used for scoring only',
  PRIMARY KEY (id),
  INDEX fk_test_entry_id (test_entry_id ASC),
  UNIQUE INDEX uq_test_entry_id_rank (test_entry_id ASC, rank ASC),
  CONSTRAINT fk_mat_data_test_entry_id
    FOREIGN KEY (test_entry_id)
    REFERENCES test_entry (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
