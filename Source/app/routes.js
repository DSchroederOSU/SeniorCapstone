
require('mongoose');
var DB = require('../config/DBFuncs.js');
var xmlparser = require('express-xml-bodyparser');
var parseString = require('xml2js').parseString;
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
var Dashboard = require('./models/dashboard-schema');
var Block = require('./models/block-schema');
module.exports = function(app, passport) {

    app.get('/', function (req, res) {

        res.render('index.html'); // load the index.html file
    });

    app.get('/api/google_user', function(req, res) {
        if (req.user){

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


    // =====================================================================
    ///////////////////////////////BLOCK API////////////////////////////////
    // =====================================================================
    app.get('/api/getUserBlocks', function(req, res) {
        User.findOne({_id : req.user._id})
            .populate({
                path: 'blocks',
                populate: {path: 'building'}
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.blocks);
        });
    });

    app.post('/api/addBlock', function(req, res) {
        var user = req.user;
        var block = new Block();
        // set all of the relevant information
        block.name = req.body.name;
        block.created_by = user;
        block.building = req.body.buildings;
        block.chart = req.body.chart;
        block.variable  = "Killowatts/Hr";
        // save the building
        block.save(function(err, savedBlock) {
            if (err)
                throw err;
            else {
                user.blocks.push(savedBlock);
                user.save(function(err) {
                    if (err)
                        throw err;
                });
                res.json(user);
            }
        });
    });


    // =====================================================================
    /////////////////////////////DASHBOARD API//////////////////////////////
    // =====================================================================
    app.post('/api/addDashboard', function(req, res) {
        console.log(req.body);
        var user = req.user;
        var dashboard = new Dashboard();
        dashboard.name = req.body.name;
        dashboard.description = req.body.description;
        dashboard.created_by = user;
        dashboard.blocks = req.body.blocks;
        dashboard.save(function(err, savedDashboard) {
            if (err)
                throw err;
            else{
                user.dashboards.push(savedDashboard);
                user.save(function(err) {
                    if (err)
                        throw err;
                });
                res.json(user);
            }

     
    });

    app.get('/api/getDashboards', function(req, res) {
        User.findOne({_id : req.user._id})
            .populate('dashboards')
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.dashboards);
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
       
        // console.log(req.body.das.devices.device.name);
    //    DB.addEntryToDatabase(req.body);
       DB.addBuildingToDatabase(req.body);
        res.send(req.body);
       

    });
    app.get('/showBuildings' ,function (req,res) {
        db.buildings.find(function (err, docs) {
            console.log(docs);
            res.json(docs);
        })
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

}


function saveBlock(blockData){

}

