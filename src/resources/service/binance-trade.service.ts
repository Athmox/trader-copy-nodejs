import CollateralTokenToTokenNameModel from '@/resources/service/model/collateral-token-to-token-name.model';
import TradeModel from '@/resources/service/model/trade.model';
import GmxTrade from './interface/gmx.interface';
import { Position, PositionType, PositionsToBeCreated, Trade, TradeClosureToBeCreated, TradeStatus } from './interface/trade.interface';
import { BinanceApiCredentials } from './interface/trade.interface';
import binanceApiCredentials from '../../../binanceApiCredentials.json';
import { Binance, MarketNewFuturesOrder } from 'binance-api-node';

/*
* die positions müssen unbedingt quantity und quantityInUsd speichern für den close trade! 
*/

interface BinanceTradeParams {
    binanceTokenName: string;
    side: "BUY" | "SELL";
    leverage: number;
    quantity: number;
}


export class BinanceTradeService {
    
    Binance = require('binance-api-node').default;

    private tradeModel = TradeModel;
    private collateralTokenToTokenNameModel = CollateralTokenToTokenNameModel;

    public async handleNewTrade(gmxTrade: GmxTrade) {

        const { QUANTITY_FACTOR } = process.env;

        const collateralTokenToTokenName = await this.collateralTokenToTokenNameModel.findOne({ collateralToken: gmxTrade.collateralToken });

        // check if trade to that collataralToken is already open
        const openTrade = await this.tradeModel.findOne({ collateralToken: gmxTrade.collateralToken, status: TradeStatus.OPEN });

        if(openTrade !== null) {
            throw new Error("trade to that collateralToken is already open!! collateralToken: " + gmxTrade.collateralToken);
        }

        if (collateralTokenToTokenName !== null && gmxTrade.increaseList.length === 1 && gmxTrade.decreaseList.length === 0) {

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
        * 
        * Im Testnet ind executedQty immer 0 -> checken ob das im mainnet auch so ist
        */

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
            console.log("set marginType error: ", error);
        }
        
        try {
            await binanceClient.futuresPositionModeChange({
                dualSidePosition: "false",
                recvWindow: 5000
            });
        } catch (error) {
            // when already set it throws an error
            console.log("set dualSidePosition error: ", error);
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

        console.log("new trade placed: ", trade);
    }

    private async placeNewPositionInBinanceApi(trade: Trade, positionToBeCreated: Position) {

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

        await this.tradeModel.updateOne(trade);

        console.log("new position for trade placed: ", trade, positionToBeCreated);
    }

    private async closeTradeInBinanceApi(trade: Trade, positionToBeCreated: Position) {

        const binanceClient: Binance = this.createBinanceClient()

        const binanceTradeParams = await this.createBinanceTradeParams(trade, positionToBeCreated, binanceClient);

        const symbolInfo = await this.getSymbolInfo(binanceClient, binanceTradeParams.binanceTokenName);

        let quantityOfAllPositions = 0;
        for(const position of trade.positions) {
            if (position?.quantity && position.type === PositionType.INCREASE) { 
                quantityOfAllPositions += position.quantity;
            } else if (position?.quantity && position.type === PositionType.DECREASE) {
                quantityOfAllPositions -= position.quantity;
            }
        }

        binanceTradeParams.quantity = quantityOfAllPositions;

        // TODO: evtl funktionierts in prod
        // quantity: binanceTradeParams.quantity.toFixed(symbolInfo.baseAssetPrecision),
        const orderParams = {
            symbol: binanceTradeParams.binanceTokenName,
            side: binanceTradeParams.side === 'BUY' ? 'SELL' : 'BUY',
            quantity: binanceTradeParams.quantity.toFixed(3),
            type: 'MARKET'
        } as MarketNewFuturesOrder;

        const order = await binanceClient.futuresOrder(orderParams);

        positionToBeCreated.quantity = Number(order.origQty);
        positionToBeCreated.binanceOrderId = order.orderId;

        trade.positions.push(positionToBeCreated);
        trade.status = TradeStatus.CLOSED;

        await this.tradeModel.updateOne(trade);

        console.log("trade closed ", trade, positionToBeCreated);
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

        if(positionToBeCreated.type === PositionType.CLOSE) {
            side = side === 'BUY' ? 'SELL' : 'BUY';
        }

        // Get the latest price of the asset
        const ticker = await binanceClient.prices({ symbol: binanceTokenName });
        const price = parseFloat(ticker[binanceTokenName]);

        // Calculate the quantity based on USD amount and current price
        const quantity = quantityInUsd / price;

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
        
        if(!symbolInfo) {
            throw new Error("info to symbol not found!! binanceTokenName: " + binanceTokenName);
        }

        return Promise.resolve(symbolInfo);
    }
}