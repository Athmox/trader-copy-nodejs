import { Document } from "mongoose";

export enum TradeStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    LIQUIDATED = "LIQUIDATED"
}

export enum PositionType {
    INCREASE = "INCREASE",
    DECREASE = "DECREASE",
    UPDATE = "UPDATE"
}

export interface ColleteralTokenToTokenName extends Document { 
    colleteralToken: string;
    colleteralTokenName: string;
    binanceTokenName: string;
}

export interface Trade extends Document {
    gmxTradeId: string;
    timestamp: Date;
    collateralToken: string;
    colleteralTokenName: string;
    binanceTokenName: string;
    leverage: number;
    isLong: boolean;
    status: string;
    sharingFactor: number;
    size: number;
    positions: Position[];
}

export interface Position {
    gmxPositionId: string;
    timestamp: Date;
    type: PositionType;
    size: number;
}

export interface PositionsToBeCreated {
    gmxTradeId: string;
    positions: Position[];
}