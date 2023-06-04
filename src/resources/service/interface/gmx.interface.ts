import { Document } from "mongoose";

export interface PriceLatest {
    id: string;
    value: string;
    timestamp: number;
    __typename: string;
}

export default interface GmxTrade extends Document {
    id: string;
    timestamp: number;
    account: string;
    collateralToken: string;
    indexToken: string;
    isLong: boolean;
    key: string;
    status: string;
    increaseList: GmxIncrease[];
    decreaseList: GmxDecrease[];
    updateList: GmxUpdate[];
    sizeDelta: string;
    collateralDelta: string;
    fee: string;
    size: string;
    collateral: string;
    averagePrice: string;
    realisedPnl: string;
    realisedPnlPercentage: string;
    settledTimestamp: number;
    closedPosition: GmxClosedPosition;
    liquidatedPosition: null;
    __typename: string;
}

export interface GmxIncrease extends Document {
    id: string;
    timestamp: number;
    account: string;
    collateralToken: string;
    indexToken: string;
    isLong: boolean;
    key: string;
    collateralDelta: string;
    sizeDelta: string;
    fee: string;
    price: string;
    __typename: string;
}

export interface GmxDecrease extends Document {
    id: string;
    timestamp: number;
    account: string;
    collateralToken: string;
    indexToken: string;
    isLong: boolean;
    key: string;
    collateralDelta: string;
    sizeDelta: string;
    fee: string;
    price: string;
    __typename: string;
}

export interface GmxUpdate extends Document {
    id: string;
    timestamp: number;
    key: string;
    size: string;
    markPrice: string;
    collateral: string;
    reserveAmount: string;
    realisedPnl: string;
    averagePrice: string;
    entryFundingRate: string;
    __typename: string;
}

export interface GmxClosedPosition extends Document {
    id: string;
    timestamp: number;
    key: string;
    size: string;
    collateral: string;
    reserveAmount: string;
    realisedPnl: string;
    averagePrice: string;
    entryFundingRate: string;
    __typename: string;
}




