import { Schema, model } from "mongoose";
import Trade from "../interface/trade.interface";

const TradeSchema = new Schema({
    gmxTradeId: { type: String, required: false },
    timestamp: { type: Number, required: false },
    collateralToken: { type: String, required: false },
    colleteralTokenName: { type: String, required: false },
    binanceTokenName: { type: String, required: false },
    leverage: { type: Number, required: false },
    isLong: { type: Boolean, required: false },
    status: { type: String, required: false },
    sharingFactor: { type: Number, required: false },
    size: { type: Number, required: false },
    positions: { type: Array, required: false },
}, {
    collection: 'trades'
});

export default model<Trade>('Trade', TradeSchema);