import express, { Application } from 'express';
import mongoose from 'mongoose';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import Controller from '@/utils/interfaces/controller.interface';
import ErrorMiddleware from '@/middleware/error.middleware';
import helmet from 'helmet';

class App {
    public express: Application;
    public port: number;

    constructor(controllers: Controller[], port: number) {
        this.express = express();
        this.port = port;

        this.initialiseDatabaseConnection();

        this.initialiseMiddleware();
        this.initialiseControllers(controllers);
        this.initialiseErrorHandling();
        this.checkEnvironmentVariables();
    }

    private initialiseMiddleware(): void {
        this.express.use(helmet());
        this.express.use(cors());
        this.express.use(morgan('dev'));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(compression());
    }

    private initialiseControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use('/api', controller.router);
        });
    }

    private initialiseErrorHandling(): void {
        this.express.use(ErrorMiddleware);
    }

    private initialiseDatabaseConnection(): void {
        const { MONGO_USER, MONGO_PASSWORD, MONGO_URL, MONGO_DATABASE, MONGO_AUTH_MECHANISM, MONGO_AUTH_DATABASE } = process.env;

        // before i used localhost, but it was not working
        // so i changed it to 127.0.0.1


        mongoose.connect(
            `mongodb://127.0.0.1:27017/trades`
        );

        // mongoose.connect(
        //     `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}/${MONGO_DATABASE}?authMechanism=${MONGO_AUTH_MECHANISM}&authSource=${MONGO_AUTH_DATABASE}`
        // );
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`);
        });
    }

    private checkEnvironmentVariables() {
        const { QUANTITY_FACTOR } = process.env;

        if(QUANTITY_FACTOR === undefined || QUANTITY_FACTOR === null || QUANTITY_FACTOR === "" || QUANTITY_FACTOR === "0" || Number(QUANTITY_FACTOR) <= 0) {
            throw new Error("QUANTITY_FACTOR is not set correctly!");
        }
    }
}


export default App;
