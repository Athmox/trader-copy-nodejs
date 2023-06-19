import winston from 'winston';

export class Logger {

    logger: winston.Logger | null = null;

    public createLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.simple(),
            transports: [
                new winston.transports.File({ filename: 'app.log' }), // Log to a file
              ],
        });
    }

    public logInfo(message: string) {
        if(this.logger === null) {
            this.createLogger();
        }

        console.log(message);
        this.logger?.info(message);
    }

}