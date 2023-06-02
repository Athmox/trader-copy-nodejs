import { Document } from "mongoose";

export enum TradeStatus {
    OPEN,
    CLOSED,
    LIQUIDATED
}

export enum PositionType {
    INCREASE = "INCREASE",
    DECREASE = "DECREASE",
    UPDATE = "UPDATE"
}

export interface CollateralTokenToTokenName { 
    collateralToken: string;
    collateralTokenName: string;
    binanceTokenName: string;
}

export interface Trade {
    gmxTradeId: string;
    timestamp: Date;
    collateralToken: string;
    colleteralTokenName: string;
    binanceTokenName: string;
    leverage: number;
    isLong: boolean;
    status: TradeStatus;
    quantityFactor: number;
    positions: Position[];
}

export interface Position {
    gmxPositionId: string;
    timestamp: Date;
    type: PositionType;
    quantity: number;
}

export interface PositionsToBeCreated {
    gmxTradeId: string;
    positions: Position[];
}