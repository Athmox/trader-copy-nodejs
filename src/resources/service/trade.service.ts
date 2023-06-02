import GmxTradeModel from '@/resources/service/model/gmx-trade.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated as PositionToBeCreated, Trade } from './interface/trade.interface';
import { BinanceTradeService } from './binance-trade.service';

// TODO: bei den timestamps evtl noch ein paar nullen dazu multiplizieren

export class TradeService {

    private tradeModel = TradeModel;

    private binanceTradeService = new BinanceTradeService();

    public async handleNewTrades(trades: GmxTrade[]) {

        const allOpenTradesInDB = await this.tradeModel.find({ status: 'OPEN' });

        const newTrades = await this.checkForNewTrades(trades, allOpenTradesInDB);

        for (const newTrade of newTrades) {
            await this.binanceTradeService.createForNewTrade(newTrade);
        }

        const newPositions = await this.checkForNewPositions(trades, allOpenTradesInDB);

        for (const newPosition of newPositions) {
            await this.binanceTradeService.createForNewPosition(newPosition);
        }

    }

    private async checkForNewTrades(trades: GmxTrade[], allOpenTradesInDB: Trade[]): Promise<GmxTrade[]> {

        const newTrades: GmxTrade[] = [];

        for (const trade of trades) {

            const foundTrade = allOpenTradesInDB.find((tradeInDB) => tradeInDB.gmxTradeId === trade.id);

            if (foundTrade === undefined && trade.closedPosition === null && trade.increaseList.length === 1 && trade.decreaseList.length === 0) {
                newTrades.push(trade);
            }
        }

        return Promise.resolve(newTrades);
    }

    private async checkForNewPositions(trades: GmxTrade[], allOpenTradesInDB: Trade[]): Promise<PositionToBeCreated[]> {

        const newPositionsToBeCreated: PositionToBeCreated[] = [];

        for (const trade of trades) {
            const foundTrade = allOpenTradesInDB.find((tradeInDB) => tradeInDB.gmxTradeId === trade.id);

            if (foundTrade !== undefined) {
                const newPositions: Position[] = [];

                // find items of increaseList that are not in trade.positions by gmxTradeId
                const increaseList = trade.increaseList;
                for (const increasePosition of increaseList) {

                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === increasePosition.id);

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: increasePosition.id,
                            quantity: Number(increasePosition.sizeDelta),
                            timestamp: new Date(Number(increasePosition.timestamp) * 1000),
                            type: PositionType.INCREASE
                        };

                        newPositions.push(newPosition);
                    }
                }

                // find items of decreaseList that are not in trade.positions by gmxTradeId
                const decreaseList = trade.decreaseList;
                for (const decreasePosition of decreaseList) {
                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === decreasePosition.id);

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: decreasePosition.id,
                            quantity: Number(decreasePosition.sizeDelta),
                            timestamp: new Date(Number(decreasePosition.timestamp) * 1000),
                            type: PositionType.DECREASE
                        };

                        newPositions.push(newPosition);
                    }
                }

                if (newPositions.length <= 2) {
                    const positionToBeCreated: PositionToBeCreated = {
                        gmxTradeId: trade.id,
                        positions: newPositions
                    };

                    newPositionsToBeCreated.push(positionToBeCreated);
                }
            }
        }

        return Promise.resolve(newPositionsToBeCreated);
    }

}