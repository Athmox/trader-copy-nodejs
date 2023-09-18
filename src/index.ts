import 'dotenv/config';
import 'module-alias/register';
import validateEnv from '@/utils/validateEnv';
import App from './app';
import GmxController from '@/resources/controller/gmx.controller';
validateEnv();

const app = new App(
    [new GmxController()],
    Number(process.env.PORT)
);

app.listen();
