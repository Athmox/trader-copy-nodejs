import { PriceLatest, TestModel, Trade } from "./gmx.model";
import WebSocket from 'ws';

export class GmxService {
    
    webSocketConnection: any;

    private initWs() {

        this.webSocketConnection = new WebSocket('wss://www.gmx.house/api-ws', {
            host: "www.gmx.house",
            origin: "https://www.gmx.house"
        });

        this.webSocketConnection.onopen = () => {
            console.log('Connected to the WebSocket server');

            this.startTradeTracking();

            // Send a message to the server
            // this.webSocketConnection.send(`{"topic":"requestLatestPriceMap","body":{"chain":42161}}`);
        };

        // Handle incoming messages
        this.webSocketConnection.onmessage = (event: WebSocket.MessageEvent) => {
            console.log('Received:', event.data);

            this.handleWsMessage(event);

            // Close the WebSocket connection
            // this.webSocketConnection.close();
        };

        // Handle WebSocket close
        this.webSocketConnection.onclose = () => {
            console.log('WebSocket connection closed');
        };

        // Handle WebSocket error
        this.webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
            console.error('WebSocket error:', error);
        };
    }

    public startTradeTracking() {
        // send a periodic message to the server to keep the connection alive
        // enable when needed
        setInterval(() => {
            console.log("Sending message to server");
            this.webSocketConnection.send(`{"topic":"requestAccountTradeList","body":{"account":"0xEEEE451963d5A81C9D94776C9519ABb6b6342Ad5","timeInterval":5256000,"chain":42161}}`);
        }, 4000);
    }
    
    public test(): TestModel {

        // Create a WebSocket client

        // Handle WebSocket connection open
        this.initWs();

        const testModel: TestModel = {name: "Its a test"}

        return testModel;
    }


    private handleWsMessage(event: WebSocket.MessageEvent) {

        const tades: Trade[] = JSON.parse(event.data.toString()).body; 

        //filter trades for status = open
        const openTrades = tades.filter(trade => trade.status === "open");

        console.log("open trades", openTrades);
    }

}