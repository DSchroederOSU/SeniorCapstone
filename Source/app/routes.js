
require('mongoose');
var xmlparser = require('express-xml-bodyparser');
var parseString = require('xml2js').parseString;
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
var DataEntry = require('./models/data-entry-schema');
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
            else 
                User.findByIdAndUpdate(
                    { _id: user._id},
                    { $push:{blocks: savedBlock}},
                    {safe: true, upsert: true, new: true},
                    (err) =>{if (err) throw(err);});
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
})
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

    // =====================================
    // XML POST PARSING ====================
    // =====================================
    // Function for handling xml post requests
    // Receives post requests, converts from XML to JSON
    // the 'xmlparser' in parameters takes care of everything
     app.post('/receiveXML', xmlparser({ trim: false, explicitArray: false }), function (req, res) {
       
        var pathShortener = req.body.das.devices.device.records.record;
        // Checks to see if new meter reports in without entry first being created
        // Creates new Building if does not exist
        Building.findOne({serial: req.body.das.serial}, function (err, doc) {
            if(doc === null){
                var entry = {
                    name: req.body.das.devices.device.name,
                    building_type: 'Academic',
                    serial: req.body.das.serial
                }
                addBuildingToDatabase(entry);
            }
            else{  // else statement to prevent duplicates, work in progress
                /*
                doc.data_entry.forEach((e) => {
                    console.log(Date(e.timestamp))
                    console.log(pathShortener.time._)
                    
                    if (e.timestamp === pathShortener.time._)
                        console.log('There\'s a match!')
                });*/
            }
        });
        
        data = new DataEntry();
        data.meter_serial = req.body.das.serial;
        data.timestamp = new Date(pathShortener.time._);
        pathShortener.point.forEach((e,i) => {data.point[i] = e.$;});
        data.save(function(err, savedBlock) {
            if (err)
                throw err;
            else {
                Building.findOneAndUpdate({serial: req.body.das.serial},
                {$push:{data_entry: data, timestamp: data.timestamp}},
                {safe: true, upsert: true, new: true},
                (err) =>{if (err) throw(err);})
            }
        });
        res.send(req.body);
    });

    app.get('/showBuildings' ,function (req,res) {
       Building.find(function (err, docs) {
            console.log(docs);
            res.json(docs);
        })
    });

    // adding xml parser for testing and debugging purposes until we get client side POST setup
    // to be called from "Add Building" feature
    app.post('/addBuilding', xmlparser({ trim: false, explicitArray: false }), function (req, res) {
        addBuildingToDatabase(req.body);
        res.send(req.body);
    });

}

function addBuildingToDatabase(entry) {
    Building.findOne({name: entry.name}, function (err, docs) {
          if(docs === null){ // ensure building doesn't exist
              var build = new Building();
               // set all of the relevant information
              build.name = entry.name
              build.building_type = entry.building_type;
              // serial can be used as identifier when adding data (data has serial # of AcquiSuite)
              build.serial = entry.serial;
              // save the building
              build.save()
                   .catch( err => {res.status(400)
                   .send("unable to save to database");})
              console.log("The building '" + entry.name + "' has been added.");
          }
          else
              console.log('Nothing was added');     
        });
  };

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

