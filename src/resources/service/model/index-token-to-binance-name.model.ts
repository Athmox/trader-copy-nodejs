import { Schema, model } from "mongoose";
import { IndexTokenToBinanceName } from "../interface/trade.interface";

const IndexTokenToBinanceNameSchema = new Schema({
    indexToken: { type: String, required: false },
    tokenName: { type: String, required: false },
    binanceTokenName: { type: String, required: false },
}, {
    collection: 'indexTokenToBinanceName'
});

export default model<IndexTokenToBinanceName>('IndexTokenToBinanceName', IndexTokenToBinanceNameSchema);
