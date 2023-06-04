import GmxTrade from "./interface/gmx.interface";
import WebSocket from 'ws';
import GmxTradeModel from '@/resources/service/model/gmx-trade.model';
import { TradeService } from "./trade.service";

export class GmxService {
    
    webSocketConnection: any;
    private tradeModel = GmxTradeModel;    
    private tradeService = new TradeService();

    public async test2(): Promise<GmxTrade> {
        
        // get trade from mongo db with id
        const foundTrade = await this.tradeModel.findById('6474e60c25d02366d17e69b5');

        console.log("found trade", foundTrade);

        const trade: GmxTrade = foundTrade !== null ? foundTrade : {} as GmxTrade;
        
        console.log("casted trade", trade);

        return trade;
    }

    private initWsConnection() {

        this.webSocketConnection = new WebSocket('wss://www.gmx.house/api-ws', {
            host: "www.gmx.house",
            origin: "https://www.gmx.house"
        });

        this.webSocketConnection.onopen = () => {
            console.log('Connected to the WebSocket server');

            this.startTradeTracking();
        };

        this.webSocketConnection.onmessage = (event: WebSocket.MessageEvent) => {

            this.handleWsMessage(event);
        };

        this.webSocketConnection.onclose = () => {
            console.log('WebSocket connection closed - try to reconnect');

            this.webSocketConnection.reconnect();
        };

        this.webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
            console.error('WebSocket error:', error);
        };
    }

    private startTradeTracking() {
        setInterval(() => {
            console.log("Sending message to server");
            this.webSocketConnection.send(`{"topic":"requestAccountTradeList","body":{"account":"0x70C4BB57ad36d5b94acCF57721511d6e3cA459C2","timeInterval":5256000,"chain":42161}}`);
        }, 4000);
    }
    
    public startGmxTradeService(): any {
        
        this.initWsConnection();

        const startFeedback = {
            status: "started"
        };
        
        return startFeedback;
    }


    private async handleWsMessage(event: WebSocket.MessageEvent) {

        const trades: GmxTrade[] = JSON.parse(event.data.toString()).body; 

        this.tradeService.handleNewTrades(trades);
    }

}