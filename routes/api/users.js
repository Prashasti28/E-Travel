const express = require('express');
const uuid = require('uuid');
const router = express.Router();
const users = require('../../Users');
const mongo = require('mongodb');
const assert = require('assert');

// Get All Users
router.get('/', (req, res) => res.json(users));      // => is an arrow function
    
// Get Single User
router.get('/:id', (req, res) => {
	const found = users.some(user => user.id === parseInt(req.params.id));  //some will make clear if id exist true o.w. false
                  // this user^^ is a variable which has been created
	if(found) {    //if found = TRUE
	res.json(users.filter(user => user.id === parseInt(req.params.id)));  //member.id === req.params.id should be of same data type
   } else{
      res.status(400).json({msg: `No member with the id of ${req.params.id}`});
   }
});  

router.get('/', function(req, res) {
	res.render('index', {
		title: 'Home'
	});
});

// Create user
router.post('/', (req, res) => {
	const newUser = {
        id: uuid.v4(),
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
	}

    if(!newUser.username || !newUser.email || !newUser.password) {
	   return res.status(400).json({ msg: 'Please include a name, email and a password'});
    }

    //users.save(newUser);  //something for mongodb rather than next 2 lines
    users.push(newUser);
    res.json(users);
});

// Update User
router.put('/:id', (req, res) => {
	const found = users.some(user => user.id === parseInt(req.params.id));  

	if(found) {
	  const updUser = req.body; 
	  users.forEach(user => {
	  	if(user.id === parseInt(req.params.id)) {
	  	user.username = updUser.username ? updUser.username : user.username;
	  	user.email = updUser.email ? updUser.email : user.email;
	  	user.password = updUser.password ? updUser.password : user.password;

	  	res.json({ msg: 'User updated', user });
	  }
	});
   } else{
      res.status(400).json({msg: `No user with the id of ${req.params.id}`});
   }
});

// Delete User
router.delete('/:id', (req, res) => {
	const found = users.some(user => user.id === parseInt(req.params.id)); 
                  
	if(found) {    
	res.json({ 
		msg: 'User Deleted', 
	    users: users.filter(user => user.id !== parseInt(req.params.id))
	});  
   } else{
      res.status(400).json({msg: `No member with the id of ${req.params.id}`});
   }
}); 

// Exports
module.exports = router;