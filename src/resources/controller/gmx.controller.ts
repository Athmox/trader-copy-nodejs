import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import { GmxService } from '../service/gmx-trade.service';

class GmxController implements Controller {
    public path = '/gmx';
    public router = Router();
    private gmxService = new GmxService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/start`,
            this.start
        );
        this.router.post(
            `${this.path}/test-2`,
            this.test2
        );
    }

    private start = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            
            const startFeedback = this.gmxService.startGmxTradeService();

            res.status(201).json(startFeedback);

        } catch (error) {
            next(new HttpException(400, 'Cannot create post'));
        }
    };

    private test2 = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            
            const testModel = await this.gmxService.test2();

            res.status(201).json(testModel);

        } catch (error) {
            next(new HttpException(400, 'Cannot create post'));
        }
    };
}

export default GmxController;