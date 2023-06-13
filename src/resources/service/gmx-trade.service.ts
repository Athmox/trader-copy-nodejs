import GmxTrade from "./interface/gmx.interface";
import WebSocket from 'ws';
import { TradeService } from "./trade.service";
import { BinanceTradeService } from "./binance-trade.service";

export class GmxService {
    private tradeService = new TradeService();
    private binanceTradeService = new BinanceTradeService();
    private traderAddress: string = "";

    private webSocketConnection: WebSocket | null = null;
    private lastWsRestartAttempt: Date | null = null;

    private restartWsConnection() {
        if (!this.webSocketConnection || this.webSocketConnection.readyState === WebSocket.CLOSED || this.webSocketConnection.readyState === WebSocket.CLOSING) {
            if (this.lastWsRestartAttempt === null || this.lastWsRestartAttempt.getTime() + 60000 < new Date().getTime()) {
                this.lastWsRestartAttempt = new Date();
                this.webSocketConnection = null;
                this.initWsConnection();
            }
        }
    }

    private initWsConnection() {

        if (this.traderAddress === "") {
            throw new Error("traderAddress is not set");
        }

        try {
            this.webSocketConnection = new WebSocket('wss://www.gmx.house/api-ws', {
                host: "www.gmx.house",
                origin: "https://www.gmx.house"
            });

            this.webSocketConnection.onopen = () => {
                console.log('Connected to the WebSocket server');

                this.startTradeTracking(this.webSocketConnection);
            };

            this.webSocketConnection.onmessage = (event: WebSocket.MessageEvent) => {

                this.handleWsMessage(event);
                this.startTradeTracking(this.webSocketConnection);
            };

            this.webSocketConnection.onclose = () => {
                console.log('WebSocket connection closed - try to reconnect');

                setTimeout(() => {
                    this.restartWsConnection();
                }, 10000);
            };

            this.webSocketConnection.onerror = (error: WebSocket.ErrorEvent) => {
                console.log('WebSocket error:', error);

                setTimeout(() => {
                    this.restartWsConnection();
                }, 10000);
            };
        } catch (error) {
            setTimeout(() => {
                this.restartWsConnection();
            }, 10000);
        }
    }

    private startTradeTracking(webSocketConnection: WebSocket | null) {

        if(!webSocketConnection || webSocketConnection.readyState !== WebSocket.OPEN) {
            return;
        }

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