-- -----------------------------------------------------
-- Tests
-- -----------------------------------------------------
SET AUTOCOMMIT=0;

INSERT IGNORE INTO test_type( name ) 
VALUES( "CONFIRMATION" ), ("ALPHA-NUMERIC"), ("RANKED WORD"), ("CLASSIFICATION");

INSERT IGNORE INTO test( name, rank_words, rank, test_type_id ) 
VALUES( "REY", true, 1, ( SELECT id FROM test_type WHERE name='RANKED WORD' ) );
INSERT IGNORE INTO test( name, rank_words, rank, test_type_id )
VALUES( "REY II", true, 6, ( SELECT id FROM test_type WHERE name='RANKED WORD' ) );
INSERT IGNORE INTO test( name, rank, test_type_id )
VALUES( "AFT", 2, ( SELECT id FROM test_type WHERE name='CLASSIFICATION' ) );
INSERT IGNORE INTO test( name, rank, test_type_id )
VALUES( "FAS (f words)", 7, ( SELECT id FROM test_type WHERE name='CLASSIFICATION' ) );
INSERT IGNORE INTO test( name, rank, test_type_id )
VALUES( "FAS (a words)", 8, ( SELECT id FROM test_type WHERE name='CLASSIFICATION' ) );
INSERT IGNORE INTO test( name, rank, test_type_id )
VALUES( "FAS (s words)", 9, ( SELECT id FROM test_type WHERE name='CLASSIFICATION' ) );

UPDATE test SET intrusion_dictionary_id = (
SELECT id FROM dictionary WHERE name='intrusions' );

UPDATE test SET variant_dictionary_id = (
SELECT id FROM dictionary WHERE name='variants' );

INSERT IGNORE INTO test( name, strict, rank, test_type_id, dictionary_id )
VALUES( "MAT (alphabet)", true, 3, 
( SELECT id FROM test_type WHERE name='CONFIRMATION' ),  
( SELECT id FROM dictionary WHERE name='confirmation' ) );
INSERT IGNORE INTO test( name, strict, rank, test_type_id, dictionary_id )
VALUES( "MAT (counting)", true, 4,
( SELECT id FROM test_type WHERE name='CONFIRMATION' ),
( SELECT id FROM dictionary WHERE name='confirmation' ) );
INSERT IGNORE INTO test( name, strict, rank, test_type_id )
VALUES( "MAT (alternation)", true, 5, ( SELECT id FROM test_type WHERE name='ALPHA-NUMERIC' ) );

COMMIT;
