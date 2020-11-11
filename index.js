const express = require('express')
const http = require('http');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
//const exphbs = require('express-handlebars');
const logger = require('./middleware/logger');
//const users = require('./Users');
//const mongo = require('mongodb');
//const assert = require('assert');
const config = require('./config/cartdata');
const app = express();  //app is a variable name


// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



// Set static folder
app.use(express.static(path.join(__dirname, 'public')));



// Connect to db
mongoose.connect(config.cartdata);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connected to Mongodb');
});

// Set routes
const pages = require('./routes/api/users.js');
const adminPages = require('./routes/admin_users.js');

app.use('/admin/users', adminPages);
app.use('/', pages);


const server = http.createServer((req, res) => {
	let filePath = path.join(
      __dirname, 
     'public',
      req.url === '/' ? 'index.html' : req.url
    );

    let extname = path.extname(filePath);

    // Initial content type
    let contentType = 'text/html';

    // Check ext and set content type
    switch(extname) {
    	case '.js':
    	  contentType = 'text/javascript';
    	  break;
    	case '.css':
    	  contentType = 'text/css';
    	  break;
    	case '.json':
    	  contentType = 'application/json';
    	  break;
    	case '.png':
    	  contentType = 'image/png';
    	  break;
    	case '.jpg':
    	  contentType = 'image/jpg';
    	  break;
    }

    // Read File and if there error we check 96th line error
    fs.readFile(filePath, (err, content) => {
    	if(err) {
    		if(err.code == 'ENOENT') {
    			//Page not found
    			fs.readFile(path.join(__dirname, 'public', '404.html'), 
                (err, content) => {
    			   res.writeHead(200, { 'Content-Type': 'text/html' });
                   res.end(content, 'utf8'); 
    			 })
    		} else {
    			// Some server error
    			res.writeHead(500);
    			res.end(`server Error : ${err.code}`);
    		}
    	}   else {
    		// Success
    		res.writeHead(200, { 'Content-Type': contentType });
    		res.end(content, 'utf8');   //This content here is of line 94 
    	}
    });
});
  

// Init middleware           //request, response, next
// app.use(logger);    //this way everytime I send API, Hello is shown in the terminal                                                                   //so we did these changes          


// Handlebars Middleware
//app.engine('handlebars', exphbs({defaultLayout: 'main'}));
//app.set('view engine', 'handlebars');


//Bosy Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));  


//Homepage Route
// app.get('/',(req, res) => 
//    res.render('index', {
// 	title: 'User App',
// 	users
//    })
// );


// Users API Routes
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
