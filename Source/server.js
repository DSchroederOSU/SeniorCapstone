// server.js

// set up ======================================================================
// get all the tools we need
var dotenv   = require('dotenv').config()
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var Building = require('./app/models/building_schema');
Building.findOne({ name : 'Johnson Hall' }, function(err, building) {
    if (err)
        return done(err);
    if (building) {
        // if Johnson Hall is found, log them in
        return null;
    } else {
        // if the building is not in our database, create a new building
        var newBuilding          = new Building();
        // set all of the relevant information
        newBuilding.name  = 'Johnson Hall';
        newBuilding.building_type = 'Engineering';
        newBuilding.meter_id  = 10101;
        newBuilding.data_entry = {date_time : new Date(), kw_hour : 1200};
        // save the building
        newBuilding.save(function(err) {
            if (err)
                throw err;
            console.log("Document Johnson Hall added.");
        });
    }
});
Building.findOne({ name : 'Kelley Engineering Center' }, function(err, building) {
    if (err)
        return done(err);
    if (building) {
        // if Johnson Hall is found, log them in
        return null;
    } else {
        // if the building is not in our database, create a new building
        var newBuilding          = new Building();
        // set all of the relevant information
        newBuilding.name  = 'Kelley Engineering Center';
        newBuilding.building_type = 'Engineering';
        newBuilding.meter_id  = 10001;
        newBuilding.data_entry = {date_time : new Date(), kw_hour : 800};
        // save the building
        newBuilding.save(function(err) {
            if (err)
                throw err;
            console.log("Document Kelley Engineering Center added.");
        });
    }
});
Building.findOne({ name : 'Austin Hall' }, function(err, building) {
    if (err)
        return done(err);
    if (building) {
        // if Johnson Hall is found, log them in
        return null;
    } else {
        // if the building is not in our database, create a new building
        var newBuilding          = new Building();
        // set all of the relevant information
        newBuilding.name  = 'Austin Hall';
        newBuilding.building_type = 'Business';
        newBuilding.meter_id  = 10000;
        newBuilding.data_entry = {date_time : new Date(), kw_hour : 1611};
        // save the building
        newBuilding.save(function(err) {
            if (err)
                throw err;
            console.log("Document Austin Hall added.");
        });
    }
});

// configuration ===============================================================

mongoose.connect(configDB.url, { useMongoClient: true }); // connect to our database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("We're connected");
});

require('./config/passport')(passport); // pass passport for configuration


// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());// get information from html forms
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
// required for passport
app.use(session({ secret: 'sustainabilityisawesome',
    resave: true,
    saveUninitialized: true})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);