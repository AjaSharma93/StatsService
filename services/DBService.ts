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
      this.db = await mysql.createPool({
        host: process.env.MYSQL_HOST_IP, // the host name
        user: process.env.MYSQL_USER, // database user
        password: process.env.MYSQL_PASSWORD, // database user password
        database: process.env.MYSQL_DATABASE, // database name
        typeCast (field, next) {
          if (field.type === "NEWDECIMAL") {
              const value = field.string();
              return (value === null) ? null : Number(value);
          }
          return next();
        }
      });

      // Check if a connection to database exists
      await this.db.getConnection();
    } catch (err) {
      console.log("Error initialising database");
      throw err;
    }
  }
}
