
require('mongoose');
var xmlparser = require('express-xml-bodyparser');
var parseString = require('xml2js').parseString;
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
var Meter = require('./models/meter-schema');
var DataEntry = require('./models/data-entry-schema');
var Dashboard = require('./models/dashboard-schema');
var Block = require('./models/block-schema');
var Story = require('./models/story-schema');
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
            //console.log(buildings);
            res.json(buildings); // return all buildings in JSON format
        });
    });
    app.post('/api/buildingMeters', function (req, res) {
       
        console.log('-----------------')
        console.log(req.body)
        console.log('hi')
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
                    {safe: true, upsert: true, new: true}, function(err, user) {
                        if (err)
                            throw(err);
                        else{
                            res.json(user);
                        }});

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
    app.get('/api/getBlockById', function(req, res) {
        Block.findOne({_id : req.query.block_id})
        .populate({
             path: 'building'
        })
        .exec(function (err, block) {
            if (err) return handleError(err);
            res.json(block);
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
                    {safe: true, upsert: true, new: true}, function(err, user) {
                        if (err)
                            throw(err);
                        else{
                            res.json(user);
                        }});
        });
    });

    app.get('/api/getDashboards', function(req, res) {
        User.findOne({_id : req.user._id})
            .populate({
                path: 'dashboards',
                populate: {
                    path: 'blocks',
                    populate: {
                        path: 'building'
                    }
                }
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.dashboards);
            });
    });

    app.post('/api/deleteDashboard', function(req, res) {
        User.findByIdAndUpdate(
            { _id: req.user._id},
            { $pull:{dashboards: req.body._id}}, function(err) {
                if (err)
                    throw(err);
                else{
                    Dashboard.remove({_id : req.body._id}, function (err) {
                        if (err) return handleError(err);
                        res.json({message: "success"});
                    });
                }
            });
    });

    // =====================================================================
    ///////////////////////////////STORY API////////////////////////////////
    // =====================================================================
    app.get('/api/getUserStories', function(req, res) {
        User.findOne({_id : req.user._id})
            .populate({path: 'stories',
                populate: {path: 'dashboards',
                    populate: {path: 'blocks',
                        populate: {path: 'building'}}}
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.stories);
            });
    });

    app.post('/api/addStory', function(req, res) {
        console.log(req.body);
        var user = req.user;
        var story = new Story();
        story.name = req.body.name;
        story.created_by = user;
        story.dashboards = req.body.dashboards;

        story.save(function(err, savedStory) {
            if (err)
                throw err;
            else
                User.findByIdAndUpdate(
                    { _id: user._id},
                    { $push:{stories: savedStory}},
                    {safe: true, upsert: true, new: true}, function(err, user) {
                        if (err)
                            throw(err);
                        else{
                            res.json(user);
                        }});
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
      /********************************************************************/

        // Used for creating test building with meters
        // comment out when not in use
        
        // metername = 'Test meter'
        // index = 0
        // for (let i = 0; i < 5; i++){
        //     meter = new Meter({
        //         name: metername + index,
        //        // building: '5a98fc4bb5ef652d9004f26b', //change to building desired
        //         meter_id: index++
        //     });
        //     bleh = {name: metername + index, meter_id: index};
        //     console.log('Saving meter')
        //     Building.findOneAndUpdate({_id: '5a98fdd7ec42871748d2260d'},
        //     {$push:{meters: bleh}},
        //     {safe: true, upsert: true, new: true},
        //     (err) =>{if (err) throw(err)})
        //     meter.building = '5a98fdd7ec42871748d2260d'
        //     meter.save().catch( err => {res.status(400).send("unable to save to database");})
           
                
        // }
/********************************************************************/
       

    // TODO:  
    //     - implement controllers for /api/buildingsMeters
        
        console.log('Time:')
        console.log(pathShortener.time._)
        entry = new DataEntry();
     
        // Checks if meter exists. If it doesn't adds one.
        Meter.findOne({meter_id: req.body.das.serial},(err,doc1) => { 
            if (doc1 === null || doc1 === undefined){
                addMeter(req.body.das)
            }
            else{
                entry.meter_id = doc1._id;
                DataEntry.findOne({timestamp:pathShortener.time._, meter_id: entry.meter_id}, (err,doc2) =>{
                    if (doc2 === null || doc2 === undefined){  
                        entry.timestamp = pathShortener.time._
                        entry.building = doc1.building;
                        console.log('entry before points')
                        console.log(entry)
                        pathShortener.point.forEach((e,i) => {entry.point[i] = e.$;});
                        // save it to data entries
                        entry.save().catch( err => {res.status(400)})
                        // add it to building
                        Building.findOneAndUpdate({_id: entry.building},
                            {$push:{data_entries: entry}},
                            {safe: true, upsert: true, new: true},
                            (err) =>{if (err) throw(err)})
                    }
                    else{
                        console.log('Duplicate detected and nothing has been added!')
                    }
            
                })
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
function addMeter(entry){
    // add meter building reference == null
}

// to be used with front end if we ever implement
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

