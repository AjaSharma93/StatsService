INSERT INTO senecastats.courses(course_uuid, course_name )
VALUES(UUID_TO_BIN(UUID()),'Physics'),
      (UUID_TO_BIN(UUID()),'Chemistry'),
      (UUID_TO_BIN(UUID()),'English');

INSERT INTO senecastats.users(user_uuid, user_name)
VALUES(UUID_TO_BIN(UUID()),'John Doe'),
      (UUID_TO_BIN(UUID()),'Will Smith'),
      (UUID_TO_BIN(UUID()),'Mary Jane');
      
SELECT BIN_TO_UUID(user_uuid),user_name FROM senecastats.users;
'696eba30-b6ad-11ec-9aad-8c1645e00e9e'
'aa52e1d5-b6a8-11ec-9aad-8c1645e00e9e'
