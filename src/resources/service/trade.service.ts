import GmxTradeModel from '@/resources/service/model/gmx-trade.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated } from './interface/trade.interface';

export class TradeService {

    private gmxTradeModel = GmxTradeModel;
    private tradeModel = TradeModel;

    public async handleNewTrades(trades: GmxTrade[]) {

        const newTrades = await this.checkForNewTrades(trades);

        for (const newTrade of newTrades) {
            await this.createForNewTrade(newTrade);
        }

        const newPositions = await this.checkForNewPositions(trades);
    
        for (const newPosition of newPositions) {
            await this.createForNewPosition(newPosition);
        }

        // get all trades from db
        // check if trade is in db
        // if not, create new trade
        // if yes, update trade
        // save trade to db
        // TODO
    }
    private async checkForNewTrades(trades: GmxTrade[]): Promise<GmxTrade[]> {
        
        const newTrades: GmxTrade[] = [];
        
        for (const trade of trades) {
            const foundTrade = await this.tradeModel.findOne({ gmxTradeId: trade.id });
            
            if (foundTrade === null) {
                newTrades.push(trade);
            }
        }
        
        return Promise.resolve(newTrades);
    }
    
    private async checkForNewPositions(trades: GmxTrade[]) {
        
        const newPositionsToBeCreated: PositionsToBeCreated[] = [];

        for (const trade of trades) {
            const foundTrade = await this.tradeModel.findOne({ gmxTradeId: trade.id });
            
            if (foundTrade !== null) {
                const newPositions: Position[] = [];
                
                // find items of increaseList that are not in trade.positions by gmxTradeId
                const increaseList = trade.increaseList;
                for (const increasePosition of increaseList) {
                    
                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === increasePosition.id);

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: increasePosition.id,
                            size: Number(increasePosition.sizeDelta),
                            timestamp: new Date(increasePosition.timestamp),
                            type: PositionType.INCREASE
                        };
                        
                        newPositions.push(newPosition);
                    }
                }

                // find items of decreaseList that are not in trade.positions by gmxTradeId
                const decreaseList = trade.decreaseList;
                for(const decreasePosition of decreaseList) {
                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === decreasePosition.id);

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: decreasePosition.id,
                            size: Number(decreasePosition.sizeDelta),
                            timestamp: new Date(decreasePosition.timestamp),
                            type: PositionType.DECREASE
                        };
                        
                        newPositions.push(newPosition);
                    }
                }

                if(newPositions.length > 0) {
                    const positionsToBeCreated: PositionsToBeCreated = {
                        gmxTradeId: trade.id,
                        positions: newPositions
                    };

                    newPositionsToBeCreated.push(positionsToBeCreated);
                }
            }
        }

        return Promise.resolve(newPositionsToBeCreated);
    }
    
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