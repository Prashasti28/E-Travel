//jshint esversion:6
require("dotenv").config();
const express = require("express");
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

//******* MONGODB CONNECT
mongoose.connect(
  "mongodb+srv://gauri-dasgupta:APproject@cars.7e3cr.mongodb.net/cars?retryWrites=true&w=majority",   //"mongodb://localhost:27017/E-Travel" 
  {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex:true
  },
  () => {
    console.log("Users Database (MongoDB) is now connected");
  }
);
// mongoose.set("useCreateIndex", true)

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
  hotelURL = "https://test.api.amadeus.com/v2/shopping/hotel-offers?cityCode=" + hotelLocation;
  https.get(hotelURL,function(response){
    response.on("data", function(data){
      const hotelData = JSON.parse(data);
      const name = hotelData.data[0].hotel.name;
      const id = hotelData.data[0].hotel.hotelId;
      const rating = hotelData.data[0].hotel.rating;
      const address = hotelData.data[0].hotel.address.lines + hotelData.data[0].hotel.address.cityName;
      const state = hotelData.data[0].hotel.address.stateCode;
      const postalCode = hotelData.data[0].hotel.address.postalCode;
      const contact = hotelData.data[0].hotel.contact.phone;
    });
  });
});


app.get("/car-booking", function(req, res){
  mongoose.connect(
  "mongodb+srv://gauri-dasgupta:APproject@cars.7e3cr.mongodb.net/cars?retryWrites=true&w=majority",   //"mongodb://localhost:27017/E-Travel" 
  {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex:true
  },
  () => {
    console.log("Users Database (MongoDB) is now connected");
  }
)
  const cursor = db.collection('cars').find();
  cursor.forEach(function(doc, err){
   resultArray.push(doc);
  }, function(){
    res.render("car-booking");
  });
});



 app.post("/car-booking-submit", function(req,res){
   //console.log(req.body);
   const pickupLocation = req.body.pickupLocation; //city code
   const pickupDate = req.body.pickupDate;
   const dropoffDate = req.body.dropoffDate;
   const seatingCapacity= req.body.seatingCapacity;
   const carType = req.body.carType;
});

// app.get("/car-booking", function(req, res){
//   res.render("car-booking");
// });

// //const car = mongoose.model('Cars', {name: String});

// //const brand = new Car({ name:'maruti'});
// //brand.save().then(() => console.log('hey'));



// //mongoose.set("useCreateIndex", true)

// // const carRouter = require('./routes/car');
// // app.use('/car', carRouter)

// app.post("/car-booking-submit", function(req,res){
//   //console.log(req.body);
//   const pickupLocation = req.body.pickupLocation; //city code
//   const pickupDate = req.body.pickupDate;
//   const dropoffDate = req.body.dropoffDate;
//   const seatingCapacity= req.body.seatingCapacity;
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
      res.write("<h1>The temperature in " + selectedCity + " is " + temp + " degrees Fahrenheit.</h1>")
      res.write("<p>Weather Description: " + weatherDescription + "</p>");
      res.write("<img src=" + imageURL + " alt='image'>");
      res.write("<p>Humidity: " + humidity + "%</p>");
      res.write("<p>Minimum and Maximum temperature: " + tempMin + ", " + tempMax + "</p>");
      res.send();
    });
  });
});




app.listen(5000, function(req, res){
  console.log("Server running on port 5000");
});
