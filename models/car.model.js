const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const carSchema = new Schema({
  carName: {type: String, required: true},
  carType: {type: String, required: true},
  pickUpLocation : {type: String, required: true},
  pickUpDate : {type: Number, required: true},
  dropoffDate : {type: Number, required: true},
  seatingCapacity : {type: Number, required: true},
  price: {type: Number, required: true},
}, {
  timestamps: true,
});

const car = mongoose.model('Car', carSchema, 'car');

module.exports = Car;


// "_id": 52,
//   "carName": "Toyota Innova",
//   "carType": "SUV",
//   "pickUpLocation": "SEA",
//   "capacity": 8,
//   "price": 200


// app.post("/car-booking-submit", function(req,res){
//   //console.log(req.body);
//   const pickupLocation = req.body.pickupLocation; //city code
//   const pickupDate = req.body.pickupDate;
//   const dropoffDate = req.body.dropoffDate;
//   const seatingCapacity= req.body.seatingCapacity;
//   const carType = req.body.carType;
// });