# Trader-Copy API
Later on a frontend part is planned, where a user can easily interact with the backend. For now interaction with the backend is only possible via postman.<br>

## Environment Variables
Without them the api will not start and thow an error. They all must be set.

### SIZE_FACTOR
This Factor gets multiplied with the buy & sell quantity for the trade.

## Start API
```npm run dev```

## Base URL
```/api/```

## Storing Binance API Key
Never push Binance API Key on GIT!!<br>

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
