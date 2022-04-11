export const queries = {
    "upsert_stats": `
    INSERT INTO senecastats.session_stats
        (session_uuid, total_modules_studied, average_score, time_studied)
    VALUES
        (UUID_TO_BIN(?), ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        session_uuid = UUID_TO_BIN(?),
        total_modules_studied = ?,
        average_score = ?,
        time_studied = ?;`,

    "upsert_session": `
    INSERT INTO senecastats.sessions
        (user_uuid, course_uuid, session_uuid)
    VALUES
        (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?))
    ON DUPLICATE KEY UPDATE
        user_uuid = UUID_TO_BIN(?),
        course_uuid = UUID_TO_BIN(?),
        session_uuid = UUID_TO_BIN(?);`,

    "select_stats": `
    SELECT
        CAST(SUM(total_modules_studied) as UNSIGNED) as totalModulesStudied,
        SUM(average_score) as averageScore,
        CAST(SUM(time_studied) as UNSIGNED) as timeStudied
    FROM session_stats stats
    INNER JOIN sessions sess on sess.session_uuid = stats.session_uuid
    AND sess.course_uuid = UUID_TO_BIN(?)
    AND sess.user_uuid = UUID_TO_BIN(?);`,

    "select_stats_session": `
    SELECT
        CAST(total_modules_studied as UNSIGNED) as totalModulesStudied,
        average_score as averageScore,
        CAST(time_studied as UNSIGNED) as timeStudied,
        BIN_TO_UUID(stats.session_uuid) as sessionId
    FROM session_stats stats
    INNER JOIN sessions sess on sess.session_uuid = stats.session_uuid
    AND sess.course_uuid = UUID_TO_BIN(?)
    AND sess.user_uuid = UUID_TO_BIN(?)
    WHERE stats.session_uuid = UUID_TO_BIN(?);`,

    "create_courses": `
    CREATE TABLE IF NOT EXISTS senecastats.courses (
        course_id INT PRIMARY KEY AUTO_INCREMENT,
        course_name VARCHAR(200) NOT NULL,
        course_uuid BINARY(16) UNIQUE NOT NULL);`,

    "create_users": `
    CREATE TABLE IF NOT EXISTS senecastats.users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        user_name VARCHAR(200) NOT NULL,
        user_uuid BINARY(16) UNIQUE NOT NULL);`,

    "create_sessions": `
    CREATE TABLE IF NOT EXISTS senecastats.sessions (
        session_id INT PRIMARY KEY AUTO_INCREMENT,
        user_uuid BINARY(16) NOT NULL,
        course_uuid BINARY(16) NOT NULL,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        FOREIGN KEY (user_uuid) REFERENCES users(user_uuid),
        FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid));`,

    "create_session_stats": `
    CREATE TABLE IF NOT EXISTS senecastats.session_stats (
        stat_id INT PRIMARY KEY AUTO_INCREMENT,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        total_modules_studied INT NOT NULL,
        average_score DECIMAL(5,2) NOT NULL,
        time_studied INT NOT NULL,
        FOREIGN KEY (session_uuid) REFERENCES sessions(session_uuid));`
}