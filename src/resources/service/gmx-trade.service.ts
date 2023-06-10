import GmxTrade from "./interface/gmx.interface";
import WebSocket from 'ws';
import { TradeService } from "./trade.service";
import { BinanceTradeService } from "./binance-trade.service";

export class GmxService {

    webSocketConnection: any;
    private tradeService = new TradeService();
    private binanceTradeService = new BinanceTradeService();
    private traderAddress: string = "";

    private initWsConnection() {

        if(this.traderAddress === ""){
            throw new Error("traderAddress is not set");
        }

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

            setTimeout(() => {
                this.webSocketConnection.removeAllListeners();
                this.webSocketConnection.terminate();
                this.webSocketConnection = null;
            }, 5000);

            setTimeout(() => {
                this.initWsConnection();
            }, 5000);
        };

        this.webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
            console.error('WebSocket error:', error);
        };
    }

    private startTradeTracking() {
        const websocketTopic = `{"topic":"requestAccountTradeList","body":{"account":"` + this.traderAddress + `","timeInterval":5256000,"chain":42161}}`;
        setInterval(() => {
            console.log("Sending message to server");
            this.webSocketConnection.send(websocketTopic);
        }, 5000);
    }

    public startGmxTradeService(traderAddress: string): any {

        this.traderAddress = traderAddress;

        this.binanceTradeService.checkBinanceApiCredentials();

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