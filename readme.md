# Trader-Copy API
Later on a frontend part is planned, where a user can easily interact with the backend. For now interaction with the backend is only possible via postman.

## Start API
```npm run dev```

## Base URL
```/api/```

## Storing Wallet Priate Keys
Never push Wallet Private Keys on GIT!!<br>
A file called ```wallet-private-keys.json``` must be created and the Keys must be stored like this: 
```javascript
[
    {
        "walletAddress": "0x1FE78ae103e965D83Be62B3...",
        "walletPrivateKey": "e58999c40f8f07dc0d78234dfe1...",
        "useForMint": true
    }
]
```

## Site to convert Date to time in millis
(https://currentmillis.com/)[https://currentmillis.com/]

## Technologies used
- ExpressJS
- nodeJS

## Starting MongoDB on MAC OS
It often happens that MongoDB does not get started with startup. For this reason we have to start it manually.

`brew services`<br/>
shows all available services  

`sudo brew services start mongodb-community`<br/>
starts the MongoDB service

`sudo brew services stop mongodb-community`<br/>
stops the MongoDB service
