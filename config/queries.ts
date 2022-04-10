export const queries = {
    "upsert_stats":`
    INSERT INTO senecastats.session_stats
        (session_uuid, total_modules_studied, average_score, time_studied)
    VALUES
        (UUID_TO_BIN(?), ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        session_uuid = UUID_TO_BIN(?),
        total_modules_studied = ?,
        average_score = ?,
        time_studied = ?;`,

    "upsert_session":`
    INSERT INTO senecastats.sessions
        (user_uuid, course_uuid, session_uuid)
    VALUES
        (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?))
    ON DUPLICATE KEY UPDATE
        user_uuid = UUID_TO_BIN(?),
        course_uuid = UUID_TO_BIN(?),
        session_uuid = UUID_TO_BIN(?);`,

    "select_stats":`
    SELECT
        CAST(SUM(total_modules_studied) as UNSIGNED) as totalModulesStudied,
        SUM(average_score) as averageScore,
        CAST(SUM(time_studied) as UNSIGNED) as timeStudied
    FROM session_stats stats
    INNER JOIN sessions sess on sess.session_uuid = stats.session_uuid
    AND sess.course_uuid = UUID_TO_BIN(?)
    AND sess.user_uuid = UUID_TO_BIN(?);`,

    "select_stats_session":`
    SELECT
        CAST(total_modules_studied as UNSIGNED) as totalModulesStudied,
        average_score as averageScore,
        CAST(time_studied as UNSIGNED) as timeStudied,
        BIN_TO_UUID(stats.session_uuid) as sessionId
    FROM session_stats stats
    INNER JOIN sessions sess on sess.session_uuid = stats.session_uuid
    AND sess.course_uuid = UUID_TO_BIN(?)
    AND sess.user_uuid = UUID_TO_BIN(?)
    WHERE stats.session_uuid = UUID_TO_BIN(?);`
}