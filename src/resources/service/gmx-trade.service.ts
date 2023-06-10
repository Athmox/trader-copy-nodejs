import GmxTrade from "./interface/gmx.interface";
import WebSocket from 'ws';
import { TradeService } from "./trade.service";
import { BinanceTradeService } from "./binance-trade.service";

export class GmxService { 
    private tradeService = new TradeService();
    private binanceTradeService = new BinanceTradeService();
    private traderAddress: string = "";

    private initWsConnection() {

        if(this.traderAddress === ""){
            throw new Error("traderAddress is not set");
        }

        try {
            let webSocketConnection = new WebSocket('wss://www.gmx.house/api-ws', {
                host: "www.gmx.house",
                origin: "https://www.gmx.house"
            });
    
            webSocketConnection.onopen = () => {
                console.log('Connected to the WebSocket server');
    
                this.startTradeTracking(webSocketConnection);
            };
    
            webSocketConnection.onmessage = (event: WebSocket.MessageEvent) => {
    
                this.handleWsMessage(event);
                this.startTradeTracking(webSocketConnection);
            };
    
            webSocketConnection.onclose = () => {
                console.log('WebSocket connection closed - try to reconnect');
                
                setTimeout(() => (
                    this.initWsConnection()
                ), 10000);
            };
    
            webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
                console.log('WebSocket error:', error);
    
                setTimeout(() => (
                    this.initWsConnection()
                ), 10000);
            };
        } catch (error) {
            setTimeout(() => (
                this.initWsConnection()
            ), 10000);
        }
    }

    private startTradeTracking(webSocketConnection: WebSocket) {
        const websocketTopic = `{"topic":"requestAccountTradeList","body":{"account":"` + this.traderAddress + `","timeInterval":5256000,"chain":42161}}`;
        setTimeout(() => {
            console.log("Sending message to server");
            webSocketConnection.send(websocketTopic);
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