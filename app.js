//jshint esversion:6
require("dotenv").config();
const express = require("express");
const http = require("http");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const Amadeus = require('amadeus');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const moment = require('moment');


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "This is my little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true});
//******* MONGODB CONNECT
// mongoose.connect(
//   "mongodb+srv://gauri-dasgupta:APproject@cars.7e3cr.mongodb.net/cars?retryWrites=true&w=majority",   //"mongodb://localhost:27017/E-Travel"
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex:true
//   },
//   () => {
//     console.log("Users Database (MongoDB) is now connected");
//   }
// );
// mongoose.set("useCreateIndex", true)

//const car = mongoose.model('Car.model', {name: String});

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_KEY,
  clientSecret: process.env.AMADEUS_SECRET
});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/goclouds",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/goclouds",
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect to frontpage.
  res.redirect("/frontpage");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/frontpage", function(req, res){
  if (req.isAuthenticated()){
    res.render("frontpage");
  } else {
    res.redirect("/login");
  }
});


app.get("/flight-booking", function(req, res){
  res.render("flight-booking");
});

app.post("/flight-booking-submit", async function(req,res){
  console.log(req.body);
  const tripType = req.body.tripType;
  const flyingFrom = req.body.flyingFrom; //city code
  const flyingTo = req.body.flyingTo;
  const inputDepDate = req.body.inputDepDate;
  const passengerCount= req.body.passengerCount;
  const childCount = req.body.childCount;
   if (tripType == "oneWay"){
     amadeus.shopping.flightOffersSearch.get({
       originLocationCode: flyingFrom,
       destinationLocationCode: flyingTo,
       departureDate: inputDepDate,
       adults: passengerCount,
       children: childCount,
       max: 15
     }).then(function (response) {
       resBody = JSON.parse(response.body);
       resBodyData = resBody.data;
       aircraftCodeList = resBody.dictionaries.aircraft;
       var i;
       res.write("<h1 style='text-align:center; padding: 30px 0;'> Search Results: From " +flyingFrom + " to " + flyingTo + "</h1>");
       for (i = 0; i < resBodyData.length; i++ ) {
         res.write("<h3 style='padding-left: 30px;'>"+ flyingFrom + " to " + flyingTo + "</h3>");
         res.write("<table style='padding: 10px 0 0 30px;'>");
         res.write("<tr>");
         res.write("<td>");
         res.write("<p>Departure: <strong><em>Terminal " + resBodyData[i].itineraries[0].segments[0].departure.terminal + "</em></strong> at <strong><em>" + resBodyData[i].itineraries[0].segments[0].departure.at.slice(11,16) + "</em></strong></p>");
         res.write("<p>Arrival: <strong><em>Terminal " + resBodyData[i].itineraries[0].segments[0].arrival.terminal + "</em></strong> at <strong><em>" + resBodyData[i].itineraries[0].segments[0].arrival.at.slice(11,16) + "</em></strong></p>");
         res.write("<p>Bookable seats left: " + resBodyData[i].numberOfBookableSeats + "</p>" )
         res.write("</td>");
         res.write("<td style='padding-left: 30px;'>");
         res.write("<p>Passengers: " + passengerCount + " Adult(s), " + childCount + " Child(ren)" + "</p>");
         //res.write("<p>Duration: " + moment.duration(resBodyData[i].itineraries[0].duration) + "</p>");
         res.write("<p> Base Price: " + resBodyData[i].price.base +" " + resBodyData[i].price.currency + "</p>");
         res.write("<p>Total Price: " + resBodyData[i].price.grandTotal +" " + resBodyData[i].price.currency + "</p>");
         //res.write("<p>Aircraft Code: " + resBodyData[i].itineraries[0].segments[1].aircraft.code + "<p>");
         res.write("</td>");
         res.write("<td style='padding-left: 30px;'>");
         res.write("<a href='/book-tickets' role='button'>Book Tickets</a>");
         res.write("</td>");
         res.write("</tr>");
         res.write("<table>");
         res.write("<hr>");
         res.send();
       }
     }).catch(function (response) {
       console.error(response);
     });
   } else { // in case of round trip, return date is taken into consideration
    const inputRetDate = req.body.inputRetDate;
    const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: flyingFrom,
        destinationLocationCode: flyingTo,
        departureDate: inputDepDate,
        returnDate: inputRetDate,
        adults: passengerCount,
        children: childCount,
        max: 15
      }).then(function (response) {
        resBody = JSON.parse(response.body);
        resBodyData = resBody.data;
        aircraftCodeList = resBody.dictionaries.aircraft;
        var i;
        res.write("<h1 style='text-align:center; padding: 30px 0;'> Search Results: From " +flyingFrom + " to " + flyingTo + "</h1>");
        for (i = 0; i < resBodyData.length; i++ ) {
          res.write("<h3 style='padding-left: 30px;'>"+ flyingFrom + " to " + flyingTo + "</h3>");
          res.write("<table style='padding: 10px 0 0 30px;'>");
          res.write("<tr>");
          res.write("<td>");
          res.write("<p>Departure: <strong><em>Terminal " + resBodyData[i].itineraries[0].segments[0].departure.terminal + "</em></strong> at <strong><em>" + resBodyData[i].itineraries[0].segments[0].departure.at.slice(11,16) + "</em></strong></p>");
          res.write("<p>Arrival: <strong><em>Terminal " + resBodyData[i].itineraries[0].segments[0].arrival.terminal + "</em></strong> at <strong><em>" + resBodyData[i].itineraries[0].segments[0].arrival.at.slice(11,16) + "</em></strong></p>");
          res.write("<p>Bookable seats left: " + resBodyData[i].numberOfBookableSeats + "</p>" )
          res.write("</td>");
          res.write("<td style='padding-left: 30px;'>");
          res.write("<p>Passengers: " + passengerCount + " Adult(s), " + childCount + " Child(ren)" + "</p>");
          //res.write("<p>Duration: " + moment.duration(resBodyData[i].itineraries[0].duration) + "</p>");
          res.write("<p> Base Price: " + resBodyData[i].price.base +" " + resBodyData[i].price.currency + "</p>");
          res.write("<p>Total Price: " + resBodyData[i].price.grandTotal +" " + resBodyData[i].price.currency + "</p>");
          //res.write("<p>Aircraft Code: " + resBodyData[i].itineraries[0].segments[1].aircraft.code + "<p>");
          res.write("</td>");
          res.write("<td style='padding-left: 30px;'>");
          res.write("<a href='/book-tickets' role='button'>Book Tickets</a>");
          res.write("</td>");
          res.write("</tr>");
          res.write("<table>");
          res.write("<hr>");
          res.send();
        }
      }).catch(function (response) {
        console.error(response);
      });
    }
});

app.get("/book-tickets", function(req, res){
  res.render("book-tickets");
});


app.get("/hotel-booking", function(req, res){
  res.render("hotel-booking");
});

app.post("/hotel-booking-submit", function(req,res){
  //console.log(req.body);
  const hotelLocation = req.body.hotelLocation; //city code
  const checkInDate = req.body.checkInDate;
  const checkOutDate = req.body.checkOutDate;
  const guestCount = req.body.guestCount;
  const roomCount= req.body.roomCount;

});


app.get("/car-booking", function(req, res){
//   mongoose.connect(
//   "mongodb+srv://gauri-dasgupta:APproject@cars.7e3cr.mongodb.net/cars?retryWrites=true&w=majority",   //"mongodb://localhost:27017/E-Travel"
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex:true
//   },
//   () => {
//     console.log("Users Database (MongoDB) is now connected");
//   }
// )
//   const cursor = db.collection('cars').find(); //db is replaced by the name in mongoose library
//   cursor.forEach(function(doc, err){
//    resultArray.push(doc);
//   }, function(){
    res.render("car-booking");
  });
// });



 app.post("/car-booking-submit", function(req,res){
   //console.log(req.body);
   const pickupLocation = req.body.pickupLocation; //city code
   const pickupDate = req.body.pickupDate;
   const dropoffDate = req.body.dropoffDate;
   const seatingCapacity= req.body.seatingCapacity;
   const carType = req.body.carType;
//   const carType = req.body.carType;
//   carURL = "mongodb+srv://gauri-dasgupta:APproject@cars.7e3cr.mongodb.net/cars?retryWrites=true&w=majority";
//   https.get(carURL, function(response){
//     response.on("data", function(data){
//       const carData = JSON.parse(data);
//       const carName = carData.data[0].car.name;
//       const id = carData.data[0].car.carId;
//       const seatingCapacity = carData.data[0].car.capacity;
//       const pickUpLocation = carData.data[0].car.location;
//       const carType = carData.data[0].car.address.stateCode;
//       const price = carData.data[0].car.address.price;
//       const pickUpDate = carData.data[0].car.date;
//     });
// });
});



app.get("/about", function(req,res){
  res.render("about");
});

app.get("/contact-us", function(req,res){
  res.render("contact-us");
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log(err);
      res.redirect("/register");
    } else{
      passport.authenticate("local") (req, res, function(){
        res.redirect("/frontpage");
      });
    }
  });
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err){
      console.log(err);
    } else {
      passport.authenticate("local") (req, res, function(){
        res.redirect("/frontpage");
      });
    }
  });
});

app.post("/weather-form", function(req,res){
  const api_key = process.env.API_KEY;
  const selectedCity = req.body.weatherCity;
  const units = "imperial";
  const weatherURL = "https://api.openweathermap.org/data/2.5/weather?q=" + selectedCity + "&appid=" + process.env.API_KEY + "&units=" + units;
  https.get(weatherURL,function(response){
    response.on("data", function(data){
      const weatherData = JSON.parse(data);
      const temp = weatherData.main.temp;
      const weatherDescription = weatherData.weather[0].description;
      const weatherIcon = weatherData.weather[0].icon;
      const humidity = weatherData.main.humidity;
      const tempMin = weatherData.main.temp_min;
      const tempMax = weatherData.main.temp_max;
      const imageURL = "http://openweathermap.org/img/wn/" + weatherIcon + "@2x.png";
      res.write("<div style='max-width: 45%; border: 1px solid black;padding: 30px;margin: 10% auto 0;background-color: rgba(255, 255, 255, 0.6); text-align: center;'>");
      res.write("<h2>The temperature in " + selectedCity + " is " + temp + " degrees Fahrenheit.</h3>")
      res.write("<p>Weather Description: " + weatherDescription + "</p>");
      res.write("<img src=" + imageURL + " alt='image'>");
      res.write("<p>Humidity: " + humidity + "%</p>");
      res.write("<p>Minimum and Maximum temperature: " + tempMin + ", " + tempMax + "</p>");
      res.write("</div>");
      res.send();
    });
  });
});




app.listen(5000, function(req, res){
  console.log("Server running on port 5000");
});
