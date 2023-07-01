import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated as PositionToBeCreated, Trade, TradeClosureToBeCreated, TradeStatus } from './interface/trade.interface';
import { BinanceTradeService } from './binance-trade.service';

/*
 * außerdem muss ich schauen ob ich bei beinance die quantity von dem asset, oder um wie viel usd ich kaufen will angeben muss
 */

export class TradeService {

    private tradeModel = TradeModel;

    private binanceTradeService = new BinanceTradeService();

    public async handleNewTrades(trades: GmxTrade[]) {

        const closedTrades = await this.checkForClosedTrades(trades);

        for (const closedTrade of closedTrades) {
            await this.binanceTradeService.handleClosedTrade(closedTrade);
        }

        const newPositions = await this.checkForNewPositions(trades);

        for (const newPosition of newPositions) {
            await this.binanceTradeService.handleNewPosition(newPosition);
        }

        const newTrades = await this.checkForNewTrades(trades);

        for (const newTrade of newTrades) {
            await this.binanceTradeService.handleNewTrade(newTrade);
        }
    }

    private async checkForNewTrades(trades: GmxTrade[]): Promise<GmxTrade[]> {

        // TODO dont include trades that are older than 15 minutes

        const allOpenTradesInDB = await this.tradeModel.find({ status: TradeStatus.OPEN });

        const newTrades: GmxTrade[] = [];

        for (const trade of trades) {

            const foundTrade = allOpenTradesInDB.find((tradeInDB) => tradeInDB.gmxTradeId === trade.id.toUpperCase());

            if (foundTrade === undefined && trade.status === 'open' && trade.closedPosition === null && trade.increaseList.length === 1 && trade.decreaseList.length === 0) {
                trade.id = trade.id.toUpperCase();
                trade.indexToken = trade.indexToken.toUpperCase();
                trade.increaseList[0].id = trade.increaseList[0].id.toUpperCase();
                newTrades.push(trade);
            }
        }

        return Promise.resolve(newTrades);
    }

    private async checkForNewPositions(trades: GmxTrade[]): Promise<PositionToBeCreated[]> {

        const allOpenTradesInDB = await this.tradeModel.find({ status: TradeStatus.OPEN });

        const newPositionsToBeCreated: PositionToBeCreated[] = [];

        for (const trade of trades) {
            const foundTrade = allOpenTradesInDB.find((tradeInDB) => tradeInDB.gmxTradeId === trade.id.toUpperCase());

            if (foundTrade !== undefined && foundTrade.status === TradeStatus.OPEN) {
                const newPositions: Position[] = [];

                // find items of increaseList that are not in trade.positions by gmxTradeId
                const increaseList = trade.increaseList;
                for (const increasePosition of increaseList) {

                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === increasePosition.id.toUpperCase());

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: increasePosition.id.toUpperCase(),
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
                    const foundPosition = foundTrade.positions.find((position) => position.gmxPositionId === decreasePosition.id.toUpperCase());

                    if (foundPosition === undefined) {
                        const newPosition: Position = {
                            gmxPositionId: decreasePosition.id.toUpperCase(),
                            unparsedQuantityInUsd: Number(decreasePosition.collateralDelta),
                            timestamp: new Date(Number(decreasePosition.timestamp) * 1000),
                            type: PositionType.DECREASE
                        };

                        newPositions.push(newPosition);
                    }
                }

                if (newPositions.length <= 2) {
                    const positionToBeCreated: PositionToBeCreated = {
                        gmxTradeId: foundTrade.gmxTradeId,
                        positions: newPositions
                    };

                    newPositionsToBeCreated.push(positionToBeCreated);
                }
            }
        }

        return Promise.resolve(newPositionsToBeCreated);
    }

    private async checkForClosedTrades(trades: GmxTrade[]): Promise<TradeClosureToBeCreated[]> {

        const allOpenTradesInDB = await this.tradeModel.find({ status: TradeStatus.OPEN });

        const closedTrades: TradeClosureToBeCreated[] = [];

        for (const trade of trades) {

            const closedPosition = trade.closedPosition;

            if (closedPosition) {

                const firstIncreasePosition = trade.increaseList[0];

                const foundTrade = allOpenTradesInDB.find(tradeInDB => {
                    const foundPosition = tradeInDB.positions.find(position => position.gmxPositionId === firstIncreasePosition.id.toUpperCase());
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
                        gmxPositionId: closedPosition.id.toUpperCase(),
                        timestamp: new Date(Number(closedPosition.timestamp) * 1000),
                        type: PositionType.CLOSE,
                        quantity: totalQuantityOfAllPositions,
                        quantityInUsd: totalQuantityInUsdOfAllPositions
                    };

                    const tradeClosureToBeCreated: TradeClosureToBeCreated = {
                        oldGmxTradeId: foundTrade.gmxTradeId,
                        newGmxTradeId: trade.id.toUpperCase(),
                        closurePosition: closePosition
                    };

                    closedTrades.push(tradeClosureToBeCreated);
                }

            }
        }

        return Promise.resolve(closedTrades);
    }

}