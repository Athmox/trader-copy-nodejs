import CollateralTokenToTokenNameModel from '@/resources/service/model/collateral-token-to-token-name.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade, { GmxIncrease } from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated, Trade, TradeStatus } from './interface/trade.interface';

export class BinanceTradeService {

    private tradeModel = TradeModel;
    private collateralTokenToTokenNameModel = CollateralTokenToTokenNameModel;

    public async createForNewTrade(gmxTrade: GmxTrade) {
        const { QUANTITY_FACTOR } = process.env;

        const collateralTokenToTokenName = await this.collateralTokenToTokenNameModel.findOne({ collateralToken: gmxTrade.collateralToken });

        if (collateralTokenToTokenName !== null && gmxTrade.increaseList.length === 1 && gmxTrade.decreaseList.length === 0) {

            const increasePosition = gmxTrade.increaseList[0];

            const timestamp = Number(gmxTrade.timestamp) * 1000;
            const leverage = Math.round(Number(gmxTrade.size) / Number(gmxTrade.collateral));
            const quantity = this.calculateQuantity(Number(increasePosition.collateralDelta), Number(QUANTITY_FACTOR));


            const position: Position = {
                gmxPositionId: increasePosition.id,
                timestamp: new Date(timestamp),
                type: PositionType.INCREASE,
                quantity: quantity
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

    public async createForNewPosition(gmxNewPositions: PositionsToBeCreated) {

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
                quantity: this.calculateQuantity(gmxNewPosition.quantity, trade.quantityFactor)
            }

            console.log("new position processed: ", newPosition);

            positions.push(newPosition);
        }

        trade.positions = positions;
    }

    private calculateQuantity(quantity: number, QUANTITY_FACTOR: number) {
        return (quantity / 10 ** 33) * QUANTITY_FACTOR;
    }
}