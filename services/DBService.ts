import { queries } from '../config/queries';
import mysql from 'mysql2/promise';

export type DBError = {
  status: number,
  errors: string[],
  error_code: number
}

export class DatabaseHelper {
  public static db: mysql.Pool;
  public static async initialiseDBConnection() {
    try {
      this.db = await mysql.createPool({
        host: process.env.MYSQL_HOST_IP, // the host name
        user: process.env.MYSQL_USER, // database user
        password: process.env.MYSQL_PASSWORD, // database user password
        database: process.env.MYSQL_DATABASE, // database name
        typeCast(field, next) { // floats are converted from strings in queries
          if (field.type === "NEWDECIMAL") {
            const value = field.string();
            return (value === null) ? null : Number(value);
          }
          return next();
        }
      });

      // Test environment mocks the DB and there's no need for schema creation.
      if(process.env.NODE_ENV==="test") return;

      // Check if a connection to database exists
      const conn = await this.db.getConnection();
      await conn.query(queries.create_courses);
      await conn.query(queries.create_users);
      await conn.query(queries.create_sessions);
      await conn.query(queries.create_session_stats);

      if (!(process.env.NODE_ENV === 'production')) {
        /* CREATE MOCK DATA */
        await conn.query(`INSERT IGNORE INTO senecastats.courses(course_uuid, course_name)
        VALUES(UUID_TO_BIN("3a83769a-8b64-4415-b26d-99d41d6b7785"), 'Physics'),
          (UUID_TO_BIN("cfb34bd0-104d-4c81-b7f9-cd12689f6aee"), 'Chemistry'),
          (UUID_TO_BIN("e247862f-068b-4889-ad36-526a2fc18439"), 'English')`);

        await conn.query(`INSERT IGNORE INTO senecastats.users(user_uuid, user_name)
        VALUES(UUID_TO_BIN("cbb3a15d-45b8-4cfb-a291-96279efd5bc6"), 'John Doe'),
          (UUID_TO_BIN("545a2dd3-e1a6-4021-b035-08b837b3424e"), 'Will Smith'),
          (UUID_TO_BIN("0c4add3e-d588-41b6-9c76-97ae3709f462"), 'Mary Jane')`);
      }
    } catch (err) {
      console.log("Error initialising database");
      throw err;
    }
  }
}
