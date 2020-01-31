/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      var currentLikes1stStock = 0;
      var currentLikes2ndStock = 0;
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, "GOOG");
          done();
        });
      });
      
      test('1 stock with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like:true })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, "GOOG");
          assert.isAtLeast(res.body.stockData.likes, 1);
          currentLikes1stStock = res.body.stockData.likes;
          // console.log("currentlikes "+currentLikes);
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like:true })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, "GOOG");
          assert.equal(res.body.stockData.likes, currentLikes1stStock);
          done();
        });
      });
      
      test('2 stocks', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog','msft'] })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, "GOOG");
          assert.equal(res.body.stockData[1].stock, "MSFT");
          currentLikes1stStock = res.body.stockData[0].rel_likes;
          currentLikes2ndStock = res.body.stockData[1].rel_likes;
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog','msft'] })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData[0].stock, "GOOG");
          assert.equal(res.body.stockData[1].stock, "MSFT");
          assert.equal(res.body.stockData[0].rel_likes, currentLikes1stStock);
          assert.equal(res.body.stockData[1].rel_likes, currentLikes2ndStock);
          done();
        });
      });
      
    });

});
