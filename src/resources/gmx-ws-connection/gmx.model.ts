export interface TestModel {
    name: string;
}

// create an interface for this json object
// {"body":{"0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f":{"id":"0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f","value":"26855310000000000000000000000000000","timestamp":1684777718,"__typename":"PriceLatest"},"0x4277f8f2c384827b5273592ff7cebd9f2c1ac258":{"id":"0x4277f8f2c384827b5273592ff7cebd9f2c1ac258","value":"850005060525666281000000000000","timestamp":1671170625,"__typename":"PriceLatest"},"0x82af49447d8a07e3bd95bd0d56f35241523fbab1":{"id":"0x82af49447d8a07e3bd95bd0d56f35241523fbab1","value":"1816674000000000000000000000000000","timestamp":1684777718,"__typename":"PriceLatest"},"0xf97f4df75117a78c1a5a0dbb814af92458539fb4":{"id":"0xf97f4df75117a78c1a5a0dbb814af92458539fb4","value":"6522000000000000000000000000000","timestamp":1684777718,"__typename":"PriceLatest"},"0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0":{"id":"0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0","value":"5088000000000000000000000000000","timestamp":1684777718,"__typename":"PriceLatest"},"0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a":{"id":"0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a","value":"58871823935939844993779000000000","timestamp":1684735597,"__typename":"PriceLatest"}},"topic":"requestLatestPriceMap"}
export interface PriceLatest {
    id: string;
    value: string;
    timestamp: number;
    __typename: string;
}

// create an interface for this json object
// {
//     "body": [
//         {
//             "id": "Trade:10:0x1c9b58cad256fc3f7fce135641e4d0d893eee4660df85cc272b88cf16ea21bdd",
//             "timestamp": 1659359827,
//             "account": "0x7b7736a2c07c4332ffad45a039d2117ae15e3f66",
//             "collateralToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//             "indexToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//             "isLong": true,
//             "key": "0x3b42576bcc6af378227aa8f61ba71470e28575add9593d4dd5d5ea4ec56b0786",
//             "status": "closed",
//             "increaseList": [
//                 {
//                     "id": "IncreasePosition:19:0x5eae853d7ee33b0f6bb8b710e1d61f92cff9dc990128ade27ba63d525a5b19f0",
//                     "timestamp": 1659359827,
//                     "account": "0x7b7736a2c07c4332ffad45a039d2117ae15e3f66",
//                     "collateralToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//                     "indexToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//                     "isLong": true,
//                     "key": "0x3b42576bcc6af378227aa8f61ba71470e28575add9593d4dd5d5ea4ec56b0786",
//                     "collateralDelta": "2214444729887834400000000000000000",
//                     "sizeDelta": "52534431670409059845165000000000000",
//                     "fee": "52534431670409059845165000000000",
//                     "price": "1647666000000000000000000000000000",
//                     "__typename": "IncreasePosition"
//                 }
//             ],
//             "decreaseList": [
//                 {
//                     "id": "DecreasePosition:9:0x1c9b58cad256fc3f7fce135641e4d0d893eee4660df85cc272b88cf16ea21bdd",
//                     "timestamp": 1659362027,
//                     "account": "0x7b7736a2c07c4332ffad45a039d2117ae15e3f66",
//                     "collateralToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//                     "indexToken": "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
//                     "isLong": true,
//                     "key": "0x3b42576bcc6af378227aa8f61ba71470e28575add9593d4dd5d5ea4ec56b0786",
//                     "collateralDelta": "0",
//                     "sizeDelta": "52534431670409059845165000000000000",
//                     "fee": "52534431670409059845165000000000",
//                     "price": "1665800000000000000000000000000000",
//                     "__typename": "DecreasePosition"
//                 }
//             ],
//             "updateList": [
//                 {
//                     "id": "UpdatePosition:20:0x5eae853d7ee33b0f6bb8b710e1d61f92cff9dc990128ade27ba63d525a5b19f0",
//                     "timestamp": 1659359827,
//                     "key": "0x3b42576bcc6af378227aa8f61ba71470e28575add9593d4dd5d5ea4ec56b0786",
//                     "size": "52534431670409059845165000000000000",
//                     "markPrice": "1647666000000000000000000000000000",
//                     "collateral": "2161910298217425340154835000000000",
//                     "reserveAmount": "31884151078197316595",
//                     "realisedPnl": "0",
//                     "averagePrice": "1647666000000000000000000000000000",
//                     "entryFundingRate": "269152",
//                     "__typename": "UpdatePosition"
//                 }
//             ],
//             "sizeDelta": "52534431670409059845165000000000000",
//             "collateralDelta": "2214444729887834400000000000000000",
//             "fee": "105068863340818119690330000000000",
//             "size": "52534431670409059845165000000000000",
//             "collateral": "2161910298217425340154835000000000",
//             "averagePrice": "1647666000000000000000000000000000",
//             "realisedPnl": "578187195652030139137557071639519",
//             "realisedPnlPercentage": "2674",
//             "settledTimestamp": 1659362027,
//             "closedPosition": {
//                 "id": "ClosePosition:10:0x1c9b58cad256fc3f7fce135641e4d0d893eee4660df85cc272b88cf16ea21bdd",
//                 "timestamp": 1659362027,
//                 "key": "0x3b42576bcc6af378227aa8f61ba71470e28575add9593d4dd5d5ea4ec56b0786",
//                 "size": "52534431670409059845165000000000000",
//                 "collateral": "0",
//                 "reserveAmount": "0",
//                 "realisedPnl": "578187195652030139137557071639519",
//                 "averagePrice": "1647666000000000000000000000000000",
//                 "entryFundingRate": "269152",
//                 "__typename": "ClosePosition"
//             },
//             "liquidatedPosition": null,
//             "__typename": "Trade"
//         }
//     ]
// }
export interface Trade {
    id: string;
    timestamp: number;
    account: string;
    collateralToken: string;
    indexToken: string;
    isLong: boolean;
    key: string;
    status: string;
    increaseList: IncreaseList[];
    decreaseList: DecreaseList[];
    updateList: UpdateList[];
    sizeDelta: string;
    collateralDelta: string;
    fee: string;
    size: string;
    collateral: string;
    averagePrice: string;
    realisedPnl: string;
    realisedPnlPercentage: string;
    settledTimestamp: number;
    closedPosition: ClosedPosition;
    liquidatedPosition: null;
    __typename: string;
}

export interface IncreaseList {
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

export interface DecreaseList {
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

export interface UpdateList {
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

export interface ClosedPosition {
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




