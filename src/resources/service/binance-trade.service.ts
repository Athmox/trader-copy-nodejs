import IndexTokenToBinanceNameModel from '@/resources/service/model/index-token-to-binance-name.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated, Trade, TradeClosureToBeCreated, TradeStatus } from './interface/trade.interface';
import { BinanceApiCredentials } from './interface/trade.interface';
import binanceApiCredentials from '../../../binanceApiCredentials.json';
import { Binance, MarketNewFuturesOrder } from 'binance-api-node';
import { Logger } from '@/utils/logger';

/*
* TODO: alle eth addr uppercase!!
*/

interface BinanceTradeParams {
    binanceTokenName: string;
    side: "BUY" | "SELL";
    leverage: number;
    quantity: number;
}


export class BinanceTradeService {

    private logger = new Logger();

    Binance = require('binance-api-node').default;

    private tradeModel = TradeModel;
    private indexTokenToBinanceNameModel = IndexTokenToBinanceNameModel;

    public async handleNewTrade(gmxTrade: GmxTrade): Promise<void> {

        const { QUANTITY_FACTOR } = process.env;

        const indexTokenToBinanceName = await this.indexTokenToBinanceNameModel.findOne({ indexToken: gmxTrade.indexToken });

        const openTrade = await this.tradeModel.findOne({ indexToken: gmxTrade.indexToken, status: TradeStatus.OPEN });

        if (openTrade && openTrade.status === TradeStatus.OPEN) {
            this.logger.logInfo("trade to that indexToken is already open!! indexToken: " + gmxTrade.indexToken, gmxTrade);
            return Promise.resolve();
        }

        if (indexTokenToBinanceName !== null && gmxTrade.increaseList.length === 1 && gmxTrade.decreaseList.length === 0) {

            const increasePosition = gmxTrade.increaseList[0];

            const timestamp = Number(gmxTrade.timestamp) * 1000;
            const leverage = Math.floor(Number(gmxTrade.size) / Number(gmxTrade.collateral));
            const quantityInUsd = this.calculateQuantityInUsd(Number(increasePosition.collateralDelta), Number(QUANTITY_FACTOR));

            const position: Position = {
                gmxPositionId: increasePosition.id,
                timestamp: new Date(timestamp),
                type: PositionType.INCREASE,
                quantityInUsd: quantityInUsd
            }

            const trade = {
                gmxTradeId: gmxTrade.id,
                timestamp: new Date(timestamp),
                indexToken: indexTokenToBinanceName.indexToken,
                tokenName: indexTokenToBinanceName.tokenName,
                binanceTokenName: indexTokenToBinanceName.binanceTokenName,
                leverage: leverage,
                isLong: gmxTrade.isLong,
                status: TradeStatus.OPEN,
                quantityFactor: Number(QUANTITY_FACTOR)
            } as Trade;

            await this.placeNewTradeInBinanceApi(trade, position);

            return Promise.resolve();

        } else if (indexTokenToBinanceName === null) {
            this.logger.logInfo("indexTokenToBinanceName not found!! indexToken: ", gmxTrade.indexToken);
            return Promise.resolve();
        }
        return Promise.resolve();
    }

    public async handleNewPosition(gmxNewPositions: PositionsToBeCreated): Promise<void> {

        const trade = await this.tradeModel.findOne({ gmxTradeId: gmxNewPositions.gmxTradeId });

        if (trade === null || trade === undefined) {
            this.logger.logInfo("trade not found!! new position connot be created!! gmxTradeId: ", gmxNewPositions.gmxTradeId);
            return Promise.resolve();
        }

        for (const gmxNewPosition of gmxNewPositions.positions) {

            const newPosition: Position = {
                gmxPositionId: gmxNewPosition.gmxPositionId,
                timestamp: gmxNewPosition.timestamp,
                type: gmxNewPosition.type,
                quantityInUsd: this.calculateQuantityInUsd(gmxNewPosition.unparsedQuantityInUsd, trade.quantityFactor)
            }

            this.logger.logInfo("new position processed: ", newPosition);

            await this.placeNewPositionInBinanceApi(trade, newPosition);
        }

        return Promise.resolve();
    }

    public async handleClosedTrade(closedTrade: TradeClosureToBeCreated): Promise<void> {

        const tradeToBeClosed = await this.tradeModel.findOne({ gmxTradeId: closedTrade.oldGmxTradeId });

        if (tradeToBeClosed === null || tradeToBeClosed === undefined) {
            this.logger.logInfo("trade not found!! closed trade connot be created!! gmxTradeId: ", closedTrade.oldGmxTradeId);
            return Promise.resolve();
        }

        const closePosition: Position = {
            gmxPositionId: closedTrade.closurePosition.gmxPositionId,
            timestamp: closedTrade.closurePosition.timestamp,
            type: PositionType.CLOSE,
            quantity: closedTrade.closurePosition.quantity,
            quantityInUsd: closedTrade.closurePosition.quantityInUsd
        }

        tradeToBeClosed.gmxTradeId = closedTrade.newGmxTradeId;

        this.logger.logInfo("closed position processed: ", closePosition);

        await this.closeTradeInBinanceApi(tradeToBeClosed, closePosition);

        return Promise.resolve();
    }

    public checkBinanceApiCredentials() {

        const { apiKey, apiSecret } = binanceApiCredentials as BinanceApiCredentials;

        if (apiKey === undefined || apiSecret === undefined) {
            const errorText: string = "binance api credentials not found - see readme!!";
            this.logger.logInfo(errorText);
            throw new Error(errorText);
        }
    }

    private calculateQuantityInUsd(quantityInUsd: number | undefined, QUANTITY_FACTOR: number) {

        if (!quantityInUsd) {
            throw new Error("quantityInUsd is undefined");
        }

        return (quantityInUsd / 10 ** 30) * QUANTITY_FACTOR;
    }

    private async placeNewTradeInBinanceApi(trade: Trade, positionToBeCreated: Position): Promise<void> {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        const symbolInfo = await this.getSymbolInfo(binanceClient, binanceTradeParams.binanceTokenName);

        try {
            await binanceClient.futuresMarginType({
                symbol: binanceTradeParams.binanceTokenName,
                marginType: 'ISOLATED', // Set the margin type to 'CROSSED' for Hedge mode
            });
        } catch (error) {
            // when already set it throws an error
            this.logger.logInfo("set marginType error: ", error);
        }

        try {
            await binanceClient.futuresPositionModeChange({
                dualSidePosition: "false",
                recvWindow: 5000
            });
        } catch (error) {
            // when already set it throws an error
            this.logger.logInfo("set dualSidePosition error: ", error);
        }

        await binanceClient.futuresLeverage({
            symbol: binanceTradeParams.binanceTokenName,
            leverage: binanceTradeParams.leverage,
        });

        // TODO: evtl funktionierts in prod
        // quantity: binanceTradeParams.quantity.toFixed(symbolInfo.baseAssetPrecision),
        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            quantity: binanceTradeParams.quantity.toFixed(3),
            side: binanceTradeParams.side,
            type: 'MARKET'
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.origQty);
        positionToBeCreated.binanceOrderId = order.orderId;
        trade.positions = [positionToBeCreated];

        await this.tradeModel.create(trade);

        this.logger.logInfo("new trade placed: ", trade);

        return Promise.resolve();
    }

    private async placeNewPositionInBinanceApi(trade: Trade, positionToBeCreated: Position): Promise<void> {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        const symbolInfo = await this.getSymbolInfo(binanceClient, binanceTradeParams.binanceTokenName);

        // TODO: evtl funktionierts in prod
        // quantity: binanceTradeParams.quantity.toFixed(symbolInfo.baseAssetPrecision),
        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side,
            quantity: binanceTradeParams.quantity.toFixed(3),
            type: 'MARKET'
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.origQty);
        positionToBeCreated.binanceOrderId = order.orderId;

        trade.positions.push(positionToBeCreated);

        await trade.save();

        this.logger.logInfo("new position for trade placed: ", trade, positionToBeCreated);

        return Promise.resolve();
    }

    private async closeTradeInBinanceApi(trade: Trade, positionToBeCreated: Position): Promise<void> {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        const symbolInfo = await this.getSymbolInfo(binanceClient, binanceTradeParams.binanceTokenName);

        // TODO: evtl funktionierts in prod
        // quantity: binanceTradeParams.quantity.toFixed(symbolInfo.baseAssetPrecision),
        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side,
            quantity: binanceTradeParams.quantity.toFixed(3),
            type: 'MARKET'
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.origQty);
        positionToBeCreated.binanceOrderId = order.orderId;

        trade.positions.push(positionToBeCreated);
        trade.status = TradeStatus.CLOSED;

        await trade.save();

        this.logger.logInfo("trade closed ", trade, positionToBeCreated);
        
        return Promise.resolve();
    }

    private createBinanceClient(): Binance {
        const { apiKey, apiSecret, testnet } = binanceApiCredentials as BinanceApiCredentials;

        const client = this.Binance({
            apiKey: apiKey,
            apiSecret: apiSecret,
            useServerTime: true,
            httpFutures: "https://testnet.binancefuture.com",
            wsFutures: "wss://stream.binancefuture.com",
        });

        return client;
    }

    private async createBinanceTradeParams(trade: Trade, positionToBeCreated: Position, binanceClient: Binance): Promise<BinanceTradeParams> {

        const quantityInUsd = positionToBeCreated.quantityInUsd;

        if (!quantityInUsd) {
            throw new Error("quantityInUsd is undefined");
        }

        const binanceTokenName = trade.binanceTokenName;
        let side = trade.isLong ? 'BUY' : "SELL";
        const leverage = trade.leverage;

        if (positionToBeCreated.type === PositionType.CLOSE) {
            side = side === 'BUY' ? 'SELL' : 'BUY';
        }

        // Get the latest price of the asset
        const ticker = await binanceClient.prices({ symbol: binanceTokenName });
        const price = parseFloat(ticker[binanceTokenName]);

        // Calculate the quantity based on USD amount and current price
        // Multiply with leverage!!
        let quantity = positionToBeCreated.quantity ? positionToBeCreated.quantity : (quantityInUsd / price) * leverage;

        const binanceTradeParams = {
            binanceTokenName: binanceTokenName,
            side: side,
            leverage: leverage,
            quantity: quantity
        } as BinanceTradeParams;

        return Promise.resolve(binanceTradeParams);
    }

    private async getSymbolInfo(binanceClient: Binance, binanceTokenName: string) {

        const exchangeInfo = await binanceClient.exchangeInfo();

        const symbolInfo = exchangeInfo.symbols.find((s) => s.symbol === binanceTokenName);

        if (!symbolInfo) {
            this.logger.logInfo("info to symbol not found!! binanceTokenName: ", binanceTokenName);
        }

        return Promise.resolve(symbolInfo);
    }
}