import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exception';
import { GmxService } from './gmx.service';

class GmxController implements Controller {
    public path = '/gmx';
    public router = Router();
    private gmxService = new GmxService();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        this.router.post(
            `${this.path}/test`,
            this.test
        );
    }

    private test = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<Response | void> => {
        try {
            
            const testModel = this.gmxService.test();

            res.status(201).json(testModel);

        } catch (error) {
            next(new HttpException(400, 'Cannot create post'));
        }
    };
}

export default GmxController;