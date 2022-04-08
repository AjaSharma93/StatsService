CREATE TABLE IF NOT EXISTS senecastats.courses (
        course_id INT PRIMARY KEY AUTO_INCREMENT,
        course_name VARCHAR(200) NOT NULL,
        course_uuid BINARY(16) UNIQUE NOT NULL);


CREATE TABLE IF NOT EXISTS senecastats.users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        user_name VARCHAR(200) NOT NULL,
        user_uuid BINARY(16) UNIQUE NOT NULL);


CREATE TABLE IF NOT EXISTS senecastats.sessions (
        session_id INT PRIMARY KEY AUTO_INCREMENT,
        user_uuid BINARY(16) NOT NULL,
        course_uuid BINARY(16) NOT NULL,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        FOREIGN KEY (user_uuid) REFERENCES users(user_uuid),
        FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid));

CREATE TABLE IF NOT EXISTS senecastats.session_stats (
        stat_id INT PRIMARY KEY AUTO_INCREMENT,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        total_modules_studied INT NOT NULL,
        average_score DECIMAL(5,2) NOT NULL,
        time_studied INT NOT NULL,
        FOREIGN KEY (session_uuid) REFERENCES sessions(session_uuid));

/* CREATE MOCK DATA */
INSERT INTO senecastats.courses(course_uuid, course_name )
VALUES(UUID_TO_BIN(UUID()),'Physics'),
      (UUID_TO_BIN(UUID()),'Chemistry'),
      (UUID_TO_BIN(UUID()),'English');

INSERT INTO senecastats.users(user_uuid, user_name)
VALUES(UUID_TO_BIN(UUID()),'John Doe'),
      (UUID_TO_BIN(UUID()),'Will Smith'),
      (UUID_TO_BIN(UUID()),'Mary Jane');