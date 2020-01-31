/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect        = require('chai').expect;
var MongoClient   = require('mongodb');
var https         = require('https'); 
var mongoose      = require('mongoose');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
  console.log("DB state: " + mongoose.connection.readyState);
  
  const Schema = mongoose.Schema;

  const stockSchema = new Schema({
    symbol: { type: String, required: true },
    likes:{ type: Number, required: true },
    ip: {type: String, required: true },
    created_on: { type: Date }
  });

  let Stock = mongoose.model("Stock", stockSchema);
  
  // developer
  app.get("/developer", function (req, res) {
    res.json({
      "developer":"Leo Vargas",
      "company":"Magno Technologies"
    });
  });
  
  
  function getStockDataBySymbol(symbol) { 
    return new Promise(resolve => {
      let url = `https://repeated-alpaca.glitch.me/v1/stock/${symbol}/quote`;
      https.get(url, response => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", data => {
          body += data;
        });
        response.on("end", () => {
          let stockData = JSON.parse(body);
          let res = {symbol:stockData.symbol, price:stockData.latestPrice.toFixed(2)};
          resolve(res);
        }); // http response end
      }); // http get url response
    });
  }

  function findStock(symbol, ip){
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // connected
          Stock.findOne({symbol:symbol, ip:ip }, function(err, stockFound){
            if (err) {
              console.error(err);
              resolve(false);
            }
            (stockFound) ? resolve(stockFound) : resolve(false);
          });
      }
    });
  }
  
  function updateStockByIp(symbol, ip, likes){
    return new Promise(resolve => {
      
      resolve(true);
    });
  }
  
  function saveNewSymbol(symbol, ip, likes) {
    return new Promise(resolve => {
      if (mongoose.connection.readyState == 1) { // connected
        let currentDate = new Date();
        let stockModel = new Stock({
          symbol:symbol,
          likes:1,
          ip:ip,
          created_on:currentDate
        });
        stockModel.save(function(err, stockSaved){
          if (err) return console.error(err);
          (stockSaved) ? resolve(stockSaved) : resolve(false);
        }); // new stock created
      }
    });
  }
  
  function getTotalLikesBySymbol(symbol){
    return new Promise(resolve => {
      let likes = 0;
      Stock.countDocuments({ symbol:symbol }, function(err, totalLikes){
        if (err) {
          console.error(err);
          resolve(0);
        }
        (totalLikes) ? resolve(totalLikes) : resolve(0);
      });
    });
  }
  
 
  app.route('/api/stock-prices')
    .get(function (req, res){
      var stockData = [];
      var stockId;
      var stockSymbol = [];
      var stockDBLikes = [];
      var stockLikes = false
      var ip = req.ip;
      var stocks = [];
      var stockArr = [];
    
      // console.log(req.query);
    
      if (mongoose.connection.readyState == 1) { // connected
        //(req.query.stock != undefined) ? stockSymbol = req.query.stock.toUpperCase() : null;
        if (req.query.stock != undefined) {
          if (Array.isArray(req.query.stock)){
            stocks = [...req.query.stock];
          } else {
            stocks.push(req.query.stock);
          }
        }
        (req.query.like != undefined) ? stockLikes = req.query.like : null;

        if (stocks.length == 0) {
          res.json("Please enter a Stock Symbol: /api/stock-prices?stock=GOOG");
        }
        
        let stockMapPromise = new Promise((resolve, reject) => {
        
          stocks.map((stock, index, arr) => {
            stockSymbol[index] = stock.toUpperCase();
            // console.log(stockSymbol[index]);
            // console.log("this are the stocks" + stockSymbol);

            let stockDataPromise = getStockDataBySymbol(stockSymbol[index])
              .then(data => {
                stockData[index] = data;
                // console.log(data);
                let findStockPromise = findStock(stockSymbol[index], ip)
                  .then(found => {
                    if (found){
                      stockDBLikes[index] = getTotalLikesBySymbol(stockSymbol[index]);
                      stockDBLikes[index].then((total) => {
                        // console.log("index: " + index + " out of " + arr.length + ", symbol: " + stockData[index].symbol);
                        stockArr.push({
                          "stock":stockData[index].symbol,
                          "price":stockData[index].price,
                          "likes":total
                        });
                        if (stockArr.length == stocks.length) resolve(stockArr); 
                      })
                    } else {
                      let saveNewSymbolPromise = saveNewSymbol(stockSymbol[index], ip, 1)
                        .then(saved => {
                          if (saved){
                            stockDBLikes[index] = getTotalLikesBySymbol(stockSymbol[index]);
                            stockDBLikes[index].then((total) => {
                              stockArr.push({
                                "stock":stockData[index].symbol,
                                "price":stockData[index].price,
                                "likes":total
                              });
                            });
                            if (stockArr.length == stocks.length) resolve(stockArr);
                          }
                        }); // saveNewSymbolPromise
                    } // findStockPromise if/else found
                }); // findStockPromise
            }); // stockDataPromise
          }); // map
        }).then((arr) => {
          if (arr.length == 1){          
            res.json({"stockData":arr[0]});
          } else {
            let resArr = []; // re-arrange stocks on original order
            resArr.push(arr.find(obj => obj.stock == stocks[0].toUpperCase()));
            resArr.push(arr.find(obj => obj.stock == stocks[1].toUpperCase()));
            // calculate rel_likes
            resArr[0].rel_likes = resArr[0].likes - resArr[1].likes;
            resArr[1].rel_likes = resArr[1].likes - resArr[0].likes;

            res.json({"stockData":[
              {stock:resArr[0].stock, price:resArr[0].price, rel_likes:resArr[0].rel_likes},
              {stock:resArr[1].stock, price:resArr[1].price, rel_likes:resArr[1].rel_likes}
            ]});  
          }
        }); // stockMapPromise
      } // DB connected      
  });  
};
