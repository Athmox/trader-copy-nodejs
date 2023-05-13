const WebSocket = require('ws');

// Specify the custom host and origin
const customHost = 'www.gmx.house';
const customOrigin = ' https://www.gmx.house';

// Connect to the WebSocket server with custom headers
const ws = new WebSocket('wss://www.gmx.house/api-ws', {
  headers: {
    Host: customHost,
    Origin: customOrigin,
  },
});

// Handle WebSocket connection open event
ws.on('open', () => {
  console.log('Connected to the server');

  // Send a message to the server
  ws.send(`{"topic":"requestLatestPriceMap","body":{"chain":42161}}`);
});

// Handle received messages
ws.on('message', (rawData) => {
    const message = JSON.parse(rawData);
    console.log('Received message from server:', message);
  });

// Handle WebSocket connection close event
ws.on('close', () => {
  console.log('Disconnected from the server');
});