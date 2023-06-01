import { Schema, model } from "mongoose";
import ColleteralTokenToTokenName from "../interface/trade.interface";

const ColleteralTokenToTokenNameSchema = new Schema({
    colleteralToken: { type: String, required: false },
    colleteralTokenName: { type: String, required: false },
    binanceTokenName: { type: String, required: false },
}, {
    collection: 'colleteralTokenToTokenName'
});

export default model<ColleteralTokenToTokenName>('ColleteralTokenToTokenName', ColleteralTokenToTokenNameSchema);
