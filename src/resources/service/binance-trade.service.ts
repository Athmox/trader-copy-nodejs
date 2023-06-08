import CollateralTokenToTokenNameModel from '@/resources/service/model/collateral-token-to-token-name.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated, Trade, TradeClosureToBeCreated, TradeStatus } from './interface/trade.interface';
import { BinanceApiCredentials } from './interface/trade.interface';
import binanceApiCredentials from '../../../binanceApiCredentials.json';
import { Binance, MarketNewFuturesOrder } from 'binance-api-node';
import { OrderType } from 'binance-api-node';

/*
* die positions müssen unbedingt quantity und quantityInUsd speichern für den close trade! 
*/

interface BinanceTradeParams {
    binanceTokenName: string;
    side: "BUY" | "SELL";
    positionSide: "LONG" | "SHORT";
    leverage: number;
    quantity: number;
}

export class BinanceTradeService {

    private tradeModel = TradeModel;
    private collateralTokenToTokenNameModel = CollateralTokenToTokenNameModel;

    public async handleNewTrade(gmxTrade: GmxTrade) {

        const { QUANTITY_FACTOR } = process.env;

        const collateralTokenToTokenName = await this.collateralTokenToTokenNameModel.findOne({ collateralToken: gmxTrade.collateralToken });

        // check if trade to that collataralToken is already open
        const openTrade = await this.tradeModel.findOne({ collateralToken: gmxTrade.collateralToken, status: TradeStatus.OPEN });

        if (collateralTokenToTokenName !== null && gmxTrade.increaseList.length === 1 && gmxTrade.decreaseList.length === 0 && !openTrade) {

            const increasePosition = gmxTrade.increaseList[0];

            const timestamp = Number(gmxTrade.timestamp) * 1000;
            const leverage = Math.round((Number(gmxTrade.size) / Number(gmxTrade.collateral)) * 100) / 100;
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

            this.placeNewTradeInBinanceApi(trade, position);

        } else if (collateralTokenToTokenName === null) {
            console.error("collateralTokenToTokenName not found!! collateralToken: ", gmxTrade.collateralToken);
        }
    }

    public async handleNewPosition(gmxNewPositions: PositionsToBeCreated) {

        const trade = await this.tradeModel.findOne({ gmxTradeId: gmxNewPositions.gmxTradeId });

        if (trade === null || trade === undefined) {
            throw new Error("trade not found!! new position connot be created!! gmxTradeId: " + gmxNewPositions.gmxTradeId);
        }

        for (const gmxNewPosition of gmxNewPositions.positions) {

            // da trade in der binace api absetzen, wenn alles okay dann in db speichern

            const newPosition: Position = {
                gmxPositionId: gmxNewPosition.gmxPositionId,
                timestamp: gmxNewPosition.timestamp,
                type: gmxNewPosition.type,
                quantityInUsd: this.calculateQuantityInUsd(gmxNewPosition.unparsedQuantityInUsd, trade.quantityFactor)
            }

            console.log("new position processed: ", newPosition);

            this.placeNewPositionInBinanceApi(trade, newPosition);
        }
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
            quantityInUsd: closedTrade.closurePosition.quantityInUsd
        }

        tradeToBeClosed.gmxTradeId = closedTrade.newGmxTradeId;

        console.log("closed position processed: ", closePosition);

        this.closeTradeInBinanceApi(tradeToBeClosed, closePosition);
    }

    public checkBinanceApiCredentials() {

        const { apiKey, apiSecret } = binanceApiCredentials as BinanceApiCredentials;

        if (apiKey === undefined || apiSecret === undefined) {
            const errorText: string = "binance api credentials not found - see readme!!";
            console.error(errorText);
            throw new Error(errorText);
        }
    }

    private calculateQuantityInUsd(quantityInUsd: number | undefined, QUANTITY_FACTOR: number) {

        if (!quantityInUsd) {
            throw new Error("quantityInUsd is undefined");
        }

        return (quantityInUsd / 10 ** 30) * QUANTITY_FACTOR;
    }

    private async placeNewTradeInBinanceApi(trade: Trade, positionToBeCreated: Position) {

        /*
        * Man kann so wie es aussieht nur einen future trade mit dem jeweiligen leverage pro trading pair haben
        * Man muss überprüfen ob man bei gmx mehrere verschiedene futures auf den gleichen trading pair haben kann
        * Wenn das möglich ist muss man beim erstellen eines neuen trades das überprüfen und verhindern
        * 
        * Wenn man verkaufen will muss man nur mehr einen order erstellen und die quantity auf 0 setzen
        * 
        * Wenn man seine position vergrößern will muss man anscheinend die quantity der position erhöhen
        * Das gleiche prinzip gilt für verkleinern
        * Die QuantityUSD Umrechnung nicht vergessen!!
        */

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        const futuresMarginTypeResult = await binanceClient.futuresMarginType({
            symbol: binanceTradeParams.binanceTokenName,
            marginType: 'CROSSED', // Set the margin type to 'CROSSED' for Hedge mode
        });

        // Create the order on Binance
        const leverageResult = await binanceClient.futuresLeverage({
            symbol: binanceTradeParams.binanceTokenName,
            leverage: binanceTradeParams.leverage,
        });

        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side,
            quantity: binanceTradeParams.quantity.toFixed(6),
            positionSide: binanceTradeParams.positionSide,
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.executedQty);
        positionToBeCreated.binanceOrderId = order.orderId;
        trade.positions = [positionToBeCreated];

        await this.tradeModel.create(trade);

        console.log("new trade placed: ", trade);
    }

    private async placeNewPositionInBinanceApi(trade: Trade, positionToBeCreated: Position) {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        let quantityOfAllPositions = 0;
        trade.positions.forEach(position => {
            if (position.type === PositionType.INCREASE && position.quantity) {
                quantityOfAllPositions += position.quantity;
            } else if (position.type === PositionType.DECREASE && position.quantity) {
                quantityOfAllPositions -= position.quantity;
            }
        });

        binanceTradeParams.quantity = binanceTradeParams.quantity + quantityOfAllPositions;

        // TODO: check if nessesary for new positions

        // const futuresMarginTypeResult = await binanceClient.futuresMarginType({
        //     symbol: binanceTradeParams.binanceTokenName,
        //     marginType: 'CROSSED', // Set the margin type to 'CROSSED' for Hedge mode
        // });

        // // Create the order on Binance
        // const leverageResult = await binanceClient.futuresLeverage({
        //     symbol: binanceTradeParams.binanceTokenName,
        //     leverage: binanceTradeParams.leverage,
        // });

        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side,
            quantity: binanceTradeParams.quantity.toFixed(6),
            positionSide: binanceTradeParams.positionSide,
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.executedQty);
        positionToBeCreated.binanceOrderId = order.orderId;

        trade.positions.push(positionToBeCreated);

        await this.tradeModel.updateOne(trade);

        console.log("new position for trade placed: ", trade, positionToBeCreated);
    }

    private async closeTradeInBinanceApi(trade: Trade, positionToBeCreated: Position) {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        binanceTradeParams.quantity = 0;

        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side,
            quantity: binanceTradeParams.quantity.toFixed(6),
            positionSide: binanceTradeParams.positionSide,
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.executedQty);
        positionToBeCreated.binanceOrderId = order.orderId;

        trade.positions.push(positionToBeCreated);
        trade.status = TradeStatus.CLOSED;

        await this.tradeModel.updateOne(trade);

        console.log("trade closed ", trade, positionToBeCreated);
    }

    private createBinanceClient(): Binance {
        const { apiKey, apiSecret, test } = binanceApiCredentials as BinanceApiCredentials;

        const binanceClient: Binance = require('node-binance-api')().options({
            APIKEY: apiKey,
            APISECRET: apiSecret,
            useServerTime: true,
            test: test
        });

        return binanceClient;
    }

    private async createBinanceTradeParams(trade: Trade, positionToBeCreated: Position, binanceClient: Binance): Promise<BinanceTradeParams> {

        const quantityInUsd = positionToBeCreated.quantityInUsd;

        if (!quantityInUsd) {
            throw new Error("quantityInUsd is undefined");
        }

        const binanceTokenName = trade.binanceTokenName;
        const side = trade.isLong ? 'BUY' : "SELL";
        const positionSide = trade.isLong ? "LONG" : "SHORT";
        const leverage = trade.leverage;

        // Get the latest price of the asset
        const ticker = await binanceClient.prices({ symbol: binanceTokenName });
        const price = parseFloat(ticker[binanceTokenName]);

        // Calculate the quantity based on USD amount and current price
        const quantity = quantityInUsd / price;

        const binanceTradeParams = {
            binanceTokenName: binanceTokenName,
            side: side,
            positionSide: positionSide,
            leverage: leverage,
            quantity: quantity
        } as BinanceTradeParams;

        return Promise.resolve(binanceTradeParams);
    }

}