require('mongoose');
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

        return res.render('./index.html'); // load the index.html file
    });

    app.get('/api/google_user', function(req, res) {
        if (req.user){

            res.json(req.user.google);
        }
        else {
            res.send(null)
        }

    });

    app.post('/api/addBuilding', function(req, res) {
        var building = new Building();
        building.name = req.body.name;
        building.building_type = req.body.building_type;
        building.meters = req.body.meters;
        console.log('building meters:')
        console.log(building.meters)

        building.save(function(err, savedBuilding) {
            if (err)
                throw err;
            else{
                savedBuilding.meters.forEach( meter => {      
               
                        updateOldBuildingMeters(meter, savedBuilding)
                            .then(addMeter(meter,savedBuilding))
                            
                
                });
            }
        });
    });

    app.get('/api/buildings', function (req, res) {
        Building.find({}, function (err, buildings) {
            //console.log(buildings);
            res.json(buildings); // return all buildings in JSON format
        });
    });
 
    app.get('/storyNav', function (req, res) {
        res.render('./story/story-selector.html'); // load the index.html file
    });

    app.get('/singleLine', function (req, res) {
        res.render('./charts/single-building-line.html'); // load the index.html file
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
    app.post('/api/deleteBuilding', function(req, res) {
        // null out the meters in this building?
        Building.remove(
            {_id : req.body._id}, function (err) {
                if (err) return handleError(err);
                res.json({message: "success"});
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

    app.get('/api/getDashboards', isLoggedIn, function(req, res) {
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
    app.get('/api/getUserStories', isLoggedIn, function(req, res) {
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

    // =====================================================================
    /////////////////////////////METER API//////////////////////////////
    // =====================================================================
    app.post('/api/addMeter', function(req, res) {
        var user = req.user;
        var meter = new Meter();
        meter.name = req.body.name;
        meter.meter_id = req.body.meter_id;
        meter.building = null;
        meter.save(function(err, savedMeter) {
            if (err)
                throw err;
            else
                res.json(savedMeter);
        });
    });
    app.get('/api/getMeters', function(req, res) {
        Meter.find({})
            .populate({
                path: 'building'
            })
            .exec(function (err, meters) {
                if (err) return handleError(err);
                res.json(meters);
            });
    });
    app.get('/api/getMeterById', function(req, res) {
        Meter.findOne({_id : req.query.meter_id})
            .populate({
                path: 'building'
            })
            .exec(function (err, meter) {
                if (err) return handleError(err);
                res.json(meter);
            });
    });

    app.post('/api/updateMeter', function(req, res) {
        console.log(req.body);
        Meter.findByIdAndUpdate(
            { _id: req.body.id},
            { $set:{'meter_id': req.body.meter_id, 'name': req.body.name}},
            {safe: true, upsert: true, new: true}, function(err, meter) {
                if (err)
                    throw(err);
                else{
                    res.json(meter);
                }});
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
    app.get('/logout', function(req, res) {
        req.session.destroy(function(e){
            req.logout();
            res.redirect('/');
        });
    });


}

function updateOldBuildingMeters(meter,building){
    return new Promise((resolve, reject) => {
        Building.findOneAndUpdate({meters: {"$in" : [meter]}, "_id":{$ne: building._id}},{$pull:{meters: meter}},function(err,oldBuilding){
            if (err){
                console.log('hecc')
               reject(err);
            } else {
                if (oldBuilding){console.log("Old Building '"+oldBuilding.name+"' has had the following meter removed: " + meter);}
                resolve();
            }
        });
    });

}

function addMeter(meter,savedBuilding) {
    return new Promise((resolve, reject) => {
        pushNullMeter(meter,savedBuilding)
            .then(()=> {Meter.findByIdAndUpdate(
                { _id: meter},
                { $set:{building: savedBuilding}},
                {safe: true, upsert: true, new: true}, (err, meter) => {
                    if (err){
                        reject(err)
                    } else{
                        console.log("Meter: "+meter.name+ " set building to: "+savedBuilding.name);
                        resolve(savedBuilding);
                    }
                }
            )
        });
    })
}

function pushNullMeter(meter,savedBuilding){
    console.log('savedBuilding');
    console.log(savedBuilding);
    // DataEntry.update({building: null}, {$set: {building: savedBuilding}});
    return new Promise((resolve, reject) => {
        Meter.findById(meter, (err,doc)=>{
            if (doc === null || doc === undefined){
                console.log('Unable to find meter in pushNullData entries for meter id: ' + meter);
                reject();
            }
            if (doc.building == null){
                console.log('Building is null, pushing stored data entries')
                DataEntry.find({meter_id: meter}, (err,docs) =>{
                    if (err){
                        console.log('Unable to push null data entries for meter id: ' + meter)
                        reject();
                    } else {
                        Building.findOneAndUpdate({_id: savedBuilding._id},
                            {$push:{data_entries: {$each: docs}}},
                            {safe: true, upsert: true, new: true},
                            (err) =>{if (err) throw(err)
                        });
                        
                    }
                    DataEntry.update({building: null}, {$set: {building: savedBuilding._id}});
                });
            } 
        });
        resolve(); 
    });
 
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page


}

function saveBlock(blockData){

}

