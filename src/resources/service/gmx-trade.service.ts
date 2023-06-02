import GmxTrade, { TestModel } from "./interface/gmx.interface";
import WebSocket from 'ws';
import GmxTradeModel from '@/resources/service/model/gmx-trade.model';

// checks incoming trades
export class GmxService {
    
    public async test2(): Promise<GmxTrade> {
        
        // get trade from mongo db with id
        const foundTrade = await this.tradeModel.findById('6474e60c25d02366d17e69b5');

        console.log("found trade", foundTrade);

        const trade: GmxTrade = foundTrade !== null ? foundTrade : {} as GmxTrade;
        
        console.log("casted trade", trade);

        return trade;
    }
    
    webSocketConnection: any;

    private tradeModel = GmxTradeModel;    

    // handle the message and change it to our required format
    // save id
    // save it to db
    // check if it is a new trade thats no in db
    // if yes, make a new trade and save it to db
    // TODO

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
            console.log('Received:', event.data);

            this.handleWsMessage(event);

            // Close the WebSocket connection
            // this.webSocketConnection.close();
        };

        this.webSocketConnection.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
            console.error('WebSocket error:', error);
        };
    }

    public startTradeTracking() {
        setInterval(() => {
            console.log("Sending message to server");
            this.webSocketConnection.send(`{"topic":"requestAccountTradeList","body":{"account":"0x70C4BB57ad36d5b94acCF57721511d6e3cA459C2","timeInterval":5256000,"chain":42161}}`);
        }, 4000);
    }
    
    public test(): TestModel {

        // Create a WebSocket client

        // Handle WebSocket connection open
        this.initWsConnection();

        const testModel: TestModel = {name: "Its a test"}

        return testModel;
    }


    private async handleWsMessage(event: WebSocket.MessageEvent) {

        const tades: GmxTrade[] = JSON.parse(event.data.toString()).body; 

        const savedTrades = await this.tradeModel.create(tades[0]);
    }

}