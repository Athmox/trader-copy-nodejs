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

    public logInfo(message: string, ...args: any[]) {
        if (this.logger === null) {
            this.createLogger();
        }

        let constructedMessage = message;

        if (args.length > 0) {
            args.forEach((arg, index) => {
                if (arg) {
                    constructedMessage += " " + JSON.stringify(arg);
                }
            }
            );
        }

        console.log(constructedMessage);
        this.logger?.info(constructedMessage);
    }

}