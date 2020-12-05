const router = require('express').Router();
let Car = require('../models/car.model')

// var location = "New Delhi";  // DEFAULT VALUES
// //var country = "India";
// var minRating =  0;
// var maxPrice = 1000000000000000;

var searchParameters = {
  "location" : location,
  //"country" : country,
  "rating" : {$gte: minRating},
  "price" : {$lte: maxPrice }
};

router.route('/').get((req, res) => {
  Hotel.find()
    .then(hotels => res.json(hotels))
    .catch(err => res.status(400).json('Error : ' + err));
});

router.route('/search').post((req,res) => {
  var location = req.body.location;
  //var country = req.body.country;
  var inputMinRating = parseFloat(req.body.minRating);
  var inputMaxPrice = Number(req.body.maxPrice);

  if (req.body.maxPrice){  // if max price is given
    if (req.body.minRating){  // if min rating is given
      searchParameters = {
        "location" : location,
        //"country" : country,
        "rating" : {$gte: inputMinRating},
        "price" : {$lte: inputMaxPrice }
      };
    }
    else{
      searchParameters = {
        "location" : location,
        //"country" : country,
        "rating" : {$gte: minRating},
        "price" : {$lte: inputMaxPrice }
      };
    }
  }
  else{ // if max price is not given
    if (req.body.minRating){  // if min rating is given
      searchParameters = {
        "location" : location,
        //"country" : country,
        "rating" : {$gte: inputMinRating},
        "price" : {$lte: maxPrice }
      };
    }
    else{
      searchParameters = {
        "location" : location,
        //"country" : country,
        "rating" : {$gte: minRating},
        "price" : {$lte: maxPrice }
      };
    }
  }
  res.redirect('/hotel/results');
});

router.route('/results').get((req, res) => {
  Hotel.find(searchParameters)
    .then(hotels => res.json(hotels))
    .catch(err => res.status(400).json('Error : ' + err));
});

module.exports = router