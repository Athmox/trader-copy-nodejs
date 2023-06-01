import GmxTrade from "./interface/gmx.interface";

export class TradeService {

    public async handleNewTrades(trades: GmxTrade[]) {
    
        // get all trades from db
        // check if trade is in db
        // if not, create new trade
        // if yes, update trade
        // save trade to db
        // TODO
    
        return Promise.resolve(null);

    }

    public async createPosition(trade: GmxTrade): Promise<GmxTrade | null> {
            
        //     
    
        return Promise.resolve(null);
    }

}