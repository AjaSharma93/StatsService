import mysql from 'mysql2/promise';

export type DBError = {
  status: number,
  errors:string[],
  error_code:number
}


export class DatabaseHelper {
  public static db: mysql.Pool;
  public static async initialiseDBConnection() {
    try {
      DatabaseHelper.db = await mysql.createPool({
        host: process.env.DB_HOST, // the host name
        user: process.env.DB_USER, // database user
        password: process.env.DB_PASS, // database user password
        database: 'senecastats', // database name
        typeCast: function (field, next) {
          if (field.type === "NEWDECIMAL") {
              var value = field.string();
              return (value === null) ? null : Number(value);
          }
          return next();
        }
      });

      const createCourses = `CREATE TABLE IF NOT EXISTS senecastats.courses (
        course_id INT PRIMARY KEY AUTO_INCREMENT,
        course_name VARCHAR(200) NOT NULL,
        course_uuid BINARY(16) UNIQUE NOT NULL);`;

      await DatabaseHelper.db.query(createCourses);

      const createUsers = `CREATE TABLE IF NOT EXISTS senecastats.users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        user_name VARCHAR(200) NOT NULL,
        user_uuid BINARY(16) UNIQUE NOT NULL);`;

      await DatabaseHelper.db.query(createUsers);

      const createSessions = `CREATE TABLE IF NOT EXISTS senecastats.sessions (
        session_id INT PRIMARY KEY AUTO_INCREMENT,
        user_uuid BINARY(16) NOT NULL,
        course_uuid BINARY(16) NOT NULL,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        FOREIGN KEY (user_uuid) REFERENCES users(user_uuid),
        FOREIGN KEY (course_uuid) REFERENCES courses(course_uuid));`

      await DatabaseHelper.db.query(createSessions);

      const createStats = `CREATE TABLE IF NOT EXISTS senecastats.session_stats (
        stat_id INT PRIMARY KEY AUTO_INCREMENT,
        session_uuid BINARY(16) UNIQUE NOT NULL,
        total_modules_studied INT NOT NULL,
        average_score DECIMAL(5,2) NOT NULL,
        time_studied INT NOT NULL,
        FOREIGN KEY (session_uuid) REFERENCES sessions(session_uuid));`

      await DatabaseHelper.db.query(createStats);
    } catch (err) {
      console.log("Error initialising database");
      DatabaseHelper.db.end();
      throw err;
    }
  }
}
