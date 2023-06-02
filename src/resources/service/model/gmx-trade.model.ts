import { Schema, model } from "mongoose";
import GmxTrade from "../interface/gmx.interface";

const GmxTradeSchema = new Schema({
    id: { type: String, required: false },
    timestamp: { type: Number, required: false },
    account: { type: String, required: false },
    collateralToken: { type: String, required: false },
    indexToken: { type: String, required: false },
    isLong: { type: Boolean, required: false },
    key: { type: String, required: false },
    status: { type: String, required: false },
    increaseList: { type: Array, required: false },
    decreaseList: { type: Array, required: false },
    updateList: { type: Array, required: false },
    sizeDelta: { type: String, required: false },
    collateralDelta: { type: String, required: false },
    fee: { type: String, required: false },
    size: { type: String, required: false },
    collateral: { type: String, required: false },
    averagePrice: { type: String, required: false },
    realisedPnl: { type: String, required: false },
    realisedPnlPercentage: { type: String, required: false },
    settledTimestamp: { type: Number, required: false },
    closedPosition: { type: Object, required: false },
    liquidatedPosition: { type: Object, required: false },
    __typename: { type: String, required: false },
}, {
    collection: 'trades'
});

export default model<GmxTrade>('GmxTrade', GmxTradeSchema);