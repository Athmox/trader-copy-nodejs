import { Document } from "mongoose";

export enum TradeStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    LIQUIDATED = "LIQUIDATED"
}

export enum PositionType {
    INCREASE = "INCREASE",
    DECREASE = "DECREASE",
    UPDATE = "UPDATE",
    CLOSE = "CLOSE"
}

export interface IndexTokenToBinanceName { 
    indexToken: string;
    tokenName: string;
    binanceTokenName: string;
}

export interface Trade extends Document{
    gmxTradeId: string;
    timestamp: Date;
    indexToken: string;
    tokenName: string;
    binanceTokenName: string;
    leverage: number;
    isLong: boolean;
    status: TradeStatus;
    quantityFactor: number;
    positions: Position[];
}

export interface Position {
    gmxPositionId: string;
    binanceOrderId?: number;
    timestamp: Date;
    type: PositionType;
    quantity?: number;
    quantityInUsd?: number;
    unparsedQuantityInUsd?: number;
}

export interface PositionsToBeCreated {
    gmxTradeId: string;
    positions: Position[];
}

export interface TradeClosureToBeCreated {
    oldGmxTradeId: string;
    newGmxTradeId: string;
    closurePosition: Position;
}

export interface BinanceApiCredentials {
    apiKey: string;
    apiSecret: string;
    testnet: boolean;
}