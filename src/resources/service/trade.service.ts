import GmxTradeModel from '@/resources/service/model/gmx-trade.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated as PositionToBeCreated, Trade, TradeClosureToBeCreated } from './interface/trade.interface';
import { BinanceTradeService } from './binance-trade.service';

/*
 * TODO: die id von den trade ändert sich wenn der trade geschlossen wird.
 * also muss ich für den fall wenn der trade geschlossen wird mit den position ids arbeiten
 * 
 * außerdem muss ich schauen ob ich bei beinance die quantity von dem asset, oder um wie viel usd ich kaufen will angeben muss
 */

export class TradeService {

    private tradeModel = TradeModel;

    private binanceTradeService = new BinanceTradeService();

    public async handleNewTrades(trades: GmxTrade[]) {

        const allOpenTradesInDB = await this.tradeModel.find({ status: 0 });

        const newTrades = await this.checkForNewTrades(trades, allOpenTradesInDB);

        for (const newTrade of newTrades) {
            await this.binanceTradeService.handleNewTrade(newTrade);
        }

        const newPositions = await this.checkForNewPositions(trades, allOpenTradesInDB);

        for (const newPosition of newPositions) {
            await this.binanceTradeService.handleNewPosition(newPosition);
        }

        const closedTrades = await this.checkForClosedTrades(trades, allOpenTradesInDB);

        for (const closedTrade of closedTrades) {
            await this.binanceTradeService.handleClosedTrade(closedTrade);
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
                            unparsedQuantityInUsd: Number(increasePosition.collateralDelta),
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
                            unparsedQuantityInUsd: Number(decreasePosition.collateralDelta),
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

    private async checkForClosedTrades(trades: GmxTrade[], allOpenTradesInDB: Trade[]): Promise<TradeClosureToBeCreated[]> {

        const closedTrades: TradeClosureToBeCreated[] = [];

        for (const trade of trades) {

            const closedPosition = trade.closedPosition;

            if (closedPosition) {

                const firstIncreasePosition = trade.increaseList[0];

                const foundTrade = allOpenTradesInDB.find(tradeInDB => {
                    const foundPosition = tradeInDB.positions.find(position => position.gmxPositionId === firstIncreasePosition.id);
                    if (foundPosition) {
                        return true;
                    }
                });

                if (foundTrade) {

                    let totalQuantityOfAllPositions = 0;
                    let totalQuantityInUsdOfAllPositions = 0;

                    for (const position of foundTrade.positions) {
                        totalQuantityOfAllPositions += position.quantity ? position.quantity : 0;
                        totalQuantityInUsdOfAllPositions += position.quantityInUsd ? position.quantityInUsd : 0;
                    }

                    const closePosition: Position = {
                        gmxPositionId: closedPosition.id,
                        timestamp: new Date(Number(closedPosition.timestamp) * 1000),
                        type: PositionType.CLOSE,
                        quantity: totalQuantityOfAllPositions,
                        quantityInUsd: totalQuantityInUsdOfAllPositions
                    };

                    const tradeClosureToBeCreated: TradeClosureToBeCreated = {
                        oldGmxTradeId: foundTrade.gmxTradeId,
                        newGmxTradeId: trade.id,
                        closurePosition: closePosition
                    };

                    closedTrades.push(tradeClosureToBeCreated);
                }

            }
        }

        return Promise.resolve(closedTrades);
    }

}