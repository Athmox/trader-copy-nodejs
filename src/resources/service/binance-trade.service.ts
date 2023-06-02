import GmxTradeModel from '@/resources/service/model/gmx-trade.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated } from './interface/trade.interface';

export class BinanceTradeService {

    public async createForNewTrade(trade: GmxTrade): Promise<GmxTrade | null> {
            
        // create trade with binance api
        // save trade to db  
    
        return Promise.resolve(null);
    }

    public async createForNewPosition(newPositions: PositionsToBeCreated): Promise<GmxTrade | null> {
            
        // create trade with binance api
        // save trade to db  
    
        return Promise.resolve(null);
    }

}