import { Schema, model } from "mongoose";
import { CollateralTokenToTokenName } from "../interface/trade.interface";

const CollateralTokenToTokenNameSchema = new Schema({
    collateralToken: { type: String, required: false },
    collateralTokenName: { type: String, required: false },
    binanceTokenName: { type: String, required: false },
}, {
    collection: 'collateralTokenToTokenName'
});

export default model<CollateralTokenToTokenName>('CollateralTokenToTokenName', CollateralTokenToTokenNameSchema);
