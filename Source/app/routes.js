require('mongoose');
var DB = require('../config/DBsampledata');
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
var xmlparser = require('express-xml-bodyparser');
var parseString = require('xml2js').parseString;

module.exports = function (app, passport) {
   
    app.get('/api/google_user', function (req, res) {
        if (req.user) {
            res.json(req.user.google);
        }
        else {
            res.send(null)
        }

    });

    app.get('/api/buildings', function (req, res) {
        Building.find({}, function (err, buildings) {
            res.json(buildings); // return all buildings in JSON format
        });
    });

    app.get('/', function (req, res) {

        res.render('index.html'); // load the index.html file
    });

    app.get('/storyNav', function (req, res) {
        res.render('./story/story-selector.html'); // load the index.html file
    });

    app.get('/login', function (req, res) {
        res.render('login.html'); // load the login.html file
    });

    // Commented out routing for now since top-nav has alternative routing using basic in-html-file JS
    /*
    app.get('/About', function (req, res) {
        res.render('views/top-nav-views/about.html'); // load the about.html file
    });
    app.get('/Contact', function (req, res) {
        res.render('views/top-nav-views/login.html'); // load the about.html file
    });
   */

    app.get('/api/getUserBlocks', function (req, res) {
        User.findOne({ _id: req.user._id })
            .populate('block.building').
            exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.block);
            });
    });

    app.post('/api/addBlock', function (req, res) {

        var user = req.user;
        var new_block = {
            name: req.body.name,
            building: req.body.buildings,
            chart: req.body.chart,
            variable: "Killowatts/Hr"
        };
        user.block.push(new_block);
        user.save(function (err) {
            if (err)
                throw err;
            var result = user.block.filter(function (block) {
                return block.name == new_block.name;
            });
            res.json(result);
        });
    });

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google',
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })
    );

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/login'
        })
    );

    // Function for handling xml post requests
    // Receives post requests, converts from XML to JSON
    // the 'xmlparser' in parameters takes care of everything
    // Currently just sends result to body, but will change to target DB
    app.post('/receive-xml', xmlparser({ trim: false, explicitArray: false }), function (req, res) {
       
        //console.log(req.body.das.devices.device.name);
        DB.addEntryToDatabase(req.body);
        res.send(req.body);

    });
    app.post('/addBuilding', function (req, res) {

       
        DB.addBuildingDatabase(req.body);
        res.send(req.body);

    });

}


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
    };
