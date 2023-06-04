import CollateralTokenToTokenNameModel from '@/resources/service/model/collateral-token-to-token-name.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade, { GmxIncrease } from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated, Trade, TradeClosureToBeCreated, TradeStatus } from './interface/trade.interface';

export class BinanceTradeService {

    private tradeModel = TradeModel;
    private collateralTokenToTokenNameModel = CollateralTokenToTokenNameModel;

    public async handleNewTrade(gmxTrade: GmxTrade) {
        const { QUANTITY_FACTOR } = process.env;

        const collateralTokenToTokenName = await this.collateralTokenToTokenNameModel.findOne({ collateralToken: gmxTrade.collateralToken });

        if (collateralTokenToTokenName !== null && gmxTrade.increaseList.length === 1 && gmxTrade.decreaseList.length === 0) {

            const increasePosition = gmxTrade.increaseList[0];

            const timestamp = Number(gmxTrade.timestamp) * 1000;
            const leverage = Math.round((Number(gmxTrade.size) / Number(gmxTrade.collateral))*100)/100;
            const quantityInUsd = this.calculateQuantityInUsd(Number(increasePosition.collateralDelta), Number(QUANTITY_FACTOR));


            const position: Position = {
                gmxPositionId: increasePosition.id,
                timestamp: new Date(timestamp),
                type: PositionType.INCREASE,
                quantityInUsd: quantityInUsd
            }

            const trade: Trade = {
                gmxTradeId: gmxTrade.id,
                timestamp: new Date(timestamp),
                collateralToken: gmxTrade.collateralToken,
                colleteralTokenName: collateralTokenToTokenName.collateralTokenName,
                binanceTokenName: collateralTokenToTokenName.binanceTokenName,
                leverage: leverage,
                isLong: gmxTrade.isLong,
                status: TradeStatus.OPEN,
                quantityFactor: Number(QUANTITY_FACTOR),
                positions: [position]
            }

            console.log("new trade processed: ", trade);

            await this.tradeModel.create(trade);

            // TODO Trade mit binance api erstellen und wenn alles okay dann in db speichern

        } else if (collateralTokenToTokenName === null) {
            console.error("collateralTokenToTokenName not found!! collateralToken: ", gmxTrade.collateralToken);
        }

        return Promise.resolve(null);
    }

    public async handleNewPosition(gmxNewPositions: PositionsToBeCreated) {

        const trade = await this.tradeModel.findOne({ gmxTradeId: gmxNewPositions.gmxTradeId });

        if (trade === null || trade === undefined) {
            throw new Error("trade not found!! new position connot be created!! gmxTradeId: " + gmxNewPositions.gmxTradeId);
        }

        const positions = trade.positions;

        for (const gmxNewPosition of gmxNewPositions.positions) {

            // da trade in der binace api absetzen, wenn alles okay dann in db speichern

            const newPosition: Position = {
                gmxPositionId: gmxNewPosition.gmxPositionId,
                timestamp: gmxNewPosition.timestamp,
                type: gmxNewPosition.type,
                quantityInUsd: this.calculateQuantityInUsd(gmxNewPosition.unparsedQuantityInUsd, trade.quantityFactor)
            }

            console.log("new position processed: ", newPosition);

            positions.push(newPosition);
        }

        trade.positions = positions;

        trade.save();
    }

    public async handleClosedTrade(closedTrade: TradeClosureToBeCreated) {
        
        const tradeToBeClosed = await this.tradeModel.findOne({ gmxTradeId: closedTrade.oldGmxTradeId });

        if (tradeToBeClosed === null || tradeToBeClosed === undefined) {
            throw new Error("old trade not found!! closed trade connot be created!! gmxTradeId: " + closedTrade.oldGmxTradeId);
        }

        const closePosition: Position = {
            gmxPositionId: closedTrade.closurePosition.gmxPositionId,
            timestamp: closedTrade.closurePosition.timestamp,
            type: PositionType.CLOSE,
            quantity: closedTrade.closurePosition.quantity,
            quantityInUsd: closedTrade.closurePosition.quantityInUsd
        }

        console.log("closed position processed: ", closePosition);

        tradeToBeClosed.positions.push(closePosition);

        tradeToBeClosed.gmxTradeId = closedTrade.newGmxTradeId;
        tradeToBeClosed.status = TradeStatus.CLOSED;
        tradeToBeClosed.save();
    }

    private calculateQuantityInUsd(quantityInUsd: number | undefined, QUANTITY_FACTOR: number) {

        if(!quantityInUsd) {
            throw new Error("quantity is undefined");
        }

        return (quantityInUsd / 10 ** 31) * QUANTITY_FACTOR;
    }
}