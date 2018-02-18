
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
        // save the blocks
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

    app.post('/api/deleteBlock', function(req, res) {
        User.findByIdAndUpdate(
            { _id: req.user._id},
            { $pull:{blocks: req.body._id}}, function(err, user) {
                if (err)
                    throw(err);
                else{
                    Block.remove({_id : req.body._id}, function (err) {
                        if (err) return handleError(err);
                        res.json({message: "success"});
                    });
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
            else
                User.findByIdAndUpdate(
                    { _id: user._id},
                    { $push:{dashboards: savedDashboard}},
                    {safe: true, upsert: true, new: true},
                    (err) => {if (err) throw(err); });
        });

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

    // =====================================
    // XML POST PARSING ====================
    // =====================================
    // Function for handling xml post requests
    // Receives post requests, converts from XML to JSON
    // the 'xmlparser' in parameters takes care of everything
     app.post('/receiveXML', xmlparser({ trim: false, explicitArray: false }), function (req, res) {
       
        pathShortener = req.body.das.devices.device.records.record;
        // Checks to see if new meter reports in without entry first being created
        // Creates new Building if does not exist

        Building.findOne({meter_id: req.body.das.serial, name:req.body.das.devices.device.name}, function (err, doc) {
            build = new Building();
           
            build.name = req.body.das.devices.device.name;
            build.building_type = 'Academic';
            build.meter_id = req.body.das.serial;
            data = new DataEntry();
            data.meter_id = req.body.das.serial;
            data.timestamp = new Date(pathShortener.time._);
            pathShortener.point.forEach((e,i) => {data.point[i] = e.$;});
           
            if(doc === null){
               build.save()
                   .catch( err => {res.status(400)
                   .send("unable to save to database");})
                   .then(()=> Building.findOneAndUpdate({meter_id: req.body.das.serial,name:req.body.das.devices.device.name},
                        {$push:{data_entry: data}},
                        {safe: true, upsert: true, new: true},
                        (err) =>{if (err) throw(err)}))
                  console.log("The building '" + build.name + "' has been added.");             
              
            }
            else if(duplicateDetection(data.timestamp)){
                console.log("Duplicate found, returning")
                return;
            }
            else{
                Building.findOneAndUpdate({meter_id: req.body.das.serial,name:req.body.das.devices.device.name},
                    {$push:{data_entry: data}},
                    {safe: true, upsert: true, new: true},
                    (err) =>{if (err) throw(err)}); 
                console.log("doc._id")
                console.log(doc._id)
            }
           //  Building.update({id: doc._id}, {$push:{data_entry: data}},{safe: true, upsert: true, new: true});
           
          
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
              // meter_id can be used as identifier when adding data (data has serial # of AcquiSuite)
              build.meter_id = entry.meter_id;
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
function duplicateDetection(entry){
   
    console.log(entry)
    Building.find({data_entry: {$elemMatch:{ timestamp: Date(entry)}}}, (err,docs) =>{
        if(docs === null){
            console.log("No dupe found")
        }
        else {
            console.log("docs is:")
            console.log(docs)
        }
    }

)}
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

