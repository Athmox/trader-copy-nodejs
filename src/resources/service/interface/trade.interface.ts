import { Date, Document } from "mongoose";

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

export default interface ColleteralTokenToTokenName extends Document { 
    colleteralToken: string;
    colleteralTokenName: string;
    binanceTokenName: string;
}

export default interface Trade extends Document {
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

export interface Position extends Document {
    timestamp: Date;
    type: PositionType;
    size: number;
}
