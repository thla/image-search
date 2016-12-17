var express = require('express')
require('dotenv').config({
  silent: true
});
var Bing = require('node-bing-api')({ accKey: process.env.BING_KEY });
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var url = 'mongodb://localhost:27017/image_search';
var app = express();
var db;

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, database) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    db = database;
    console.log('Connection established to', url);
  }
});

app.get('/api/latest/imagesearch', function (req, res) {
  console.log('query history');
  db.collection('history').find({}, {fields: {_id : 0}}).toArray((err, result) => {
    if (err) return console.log(err)
    // renders index.ejs
    res.end(JSON.stringify(result));
  });
});

app.get('/:query', function (req, res) {
  var query = req.params.query;
  var offset = req.query.offset;
  var size = 10; 
  
  console.log("query.offset " + offset);

  var histitem = {term : query, when : new Date()};
  db.collection('history').save(histitem, (err, result) => {
      if (err) return console.log(err);
  
      console.log('saved to database');
    })

  Bing.images(query, {
      top: size,
      skip: offset 
    },
    function(err, results, body) {
      if (err) throw err;
      //console.log(results);
      res.send(body.value.map(makeResList));
    });
});

app.listen(parseInt(process.env.PORT), function () {
  console.log('Example app listening on port: ' + process.env.PORT);
})



function makeResList(img) {
  // Construct object from the json result
  return {
    "url": img.contentUrl,
    "snippet": img.name,
    "thumbnail": img.thumbnailUrl,
    "context": img.hostPageUrl
  };
}