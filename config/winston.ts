import * as winston from "winston";
// creates a new Winston Logger
export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
  ],
  exitOnError: false
});

export class LoggerStream {
  write(message: string) {
      logger.info(message.substring(0, message.lastIndexOf('\n')));
  }
}