/**
 * @file Contains the Express routes for the server responsible for user input as well as serving content.
 * @author Aubrey Thenell, Daniel Schroede, Parker Bruni.
 * @module PublicServer
 * 
 */

require('mongoose');
require('mongodb');
const Json2csvParser = require('json2csv').Parser;
var _ = require('underscore');
var parseString = require('xml2js').parseString;
var bodyParser = require('body-parser');
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
var Meter = require('./models/meter-schema');
var DataEntry = require('./models/data-entry-schema');
var Dashboard = require('./models/dashboard-schema');
var Block = require('./models/block-schema');
var Story = require('./models/story-schema');
var AWS = require('aws-sdk');
var filter = require('content-filter');
var blackList = ['$', '{', '&&', '||'];
var options = {
    urlBlackList: blackList,
    bodyBlackList: blackList
};


module.exports = function (app, passport) {
    app.use(filter(options));
    app.get('/', function (req, res) {

        return res.render('./index.html'); // load the index.html file
    });
    /**
     * Route serving login authorization.
     * @name Google->api/google_user)
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {google}
     */
    app.get('/api/google_user', function (req, res) {
        if (req.user) {
            res.json({google: req.user.google, accessLevel: req.user.accountAccess});
        } else {
            res.send(null)
        }
    });


    /**
     * Route for adding buildings through the application interface.
     * @name Building/post->api/addBuilding
     * @function
     * @memberof module:PublicServer
     * @inner
     * @fires updateOldBuildingMeters
     * @fires addMeter
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {Building}
     */
    app.post('/api/addBuilding', function (req, res) {
        var building = new Building();
        building.name = req.body.name;
        building.building_type = req.body.building_type;
        building.meters = req.body.meters;
        building.save(function (err, savedBuilding) {
            if (err)
                throw err;
            else {
                savedBuilding.meters.forEach(meter => {
                    updateOldBuildingMeters(meter, savedBuilding)
                        .then(addMeter(meter, savedBuilding))
                });
                res.json(savedBuilding);

            }
        });
    });

    /**
     * Route for updating buildings through the application interface.
     * @name Building/post->api/updateBuilding
     * @function
     * @memberof module:PublicServer
     * @inner
     * @fires updateOldBuildingMeters
     * @fires addMeter
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {Building}
     */
    app.post('/api/updateBuilding', function (req, res) {
        Building.findByIdAndUpdate({
            _id: req.body._id
        }, {
            $set: {
                'name': req.body.name,
                'building_type': req.body.building_type,
                'meters': req.body.meters
                // instead of pushing meters here, might do similar function call like in addBuilding
            }
        }, {
            safe: true,
            upsert: true,
            new: true
        }, function (err, meter) {
            if (err)
                throw (err);
            else {
                req.body.meters.forEach(meter => {
                    updateOldBuildingMeters(meter._id, req.body)
                        .then(addMeter(meter._id, req.body))
                });

            }
        });
        res.json(req.body);
    });

    /**
     * Route for deleting buildings through the application interface.
     * @name Building/post->api/deleteBuilding
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {String}
     */
    app.post('/api/deleteBuilding', function (req, res) {
        // null out the meters in this building?
        Building.remove({
            _id: req.body._id
        }, function (err) {
            if (err) return handleError(err);
            Meter.updateMany({
                building: req.body._id
            }, {
                $set: {
                    building: null
                }
            }, () => {
                DataEntry.updateMany({
                    building: req.body._id
                }, {
                    $set: {
                        building: null
                    }
                }, () => res.json({
                    message: "success"
                }));
            });


        });
    });
    
    /**
     * Route for returning all of the buildings stored in the database to the application.
     * @name Building/get->api/buildings
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {Building[]}
     */
    app.get('/api/buildings', function (req, res) {
        Building.find({})
            .select('-data_entries')
            .exec(function (err, buildings) {
                // returns all buildings except the 'null' one that keeps showing up
                // temporary fix that makes app look clean
                // need to find root cause still
                res.json(buildings.filter(building => building._id != null)); // return all buildings in JSON format
            });
    });

    /**
     * Route for returning a building given a MongoDB id tag.
     * @name Building/get->api/getBuildingById
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {Building}
     */
    app.get('/api/getBuildingById', function (req, res) {
        // delete a building then set it's meters/data 'building' var to null
        Building.findOne({
                _id: req.query._id
            })
            .populate({
                path: 'meters'
            })
            .exec(function (err, building) {
                if (err) return handleError(err);
                res.json(building);
            });
    });

    /**
     * Route for returning all of the data entries assosciated with a building, given an id
     * @name Building/get->api/getBuildingData
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                             - Express path.
     * @param {callback} callback                       - Express middlewear.
     * @param {Object} callback.req                     - Contains request data.
     * @param {Object} callback.req.query               - Contains passed query.
     * @param {String[]} callback.req.query.buildings   - Array of building ids.
     * @param {String} callback.req.query.start         - Start time to filter.
     * @param {String} callback.req.query.end           - End time to filter.
     * @param {String} callback.req.query.var           - The unit type.
     * @returns {{String, String, String}}
     */
    app.get('/api/getBuildingData', function (req, res) {
        var match;
        if (req.query && req.query.start && req.query.end) {
            match = {
                timestamp: {
                    $lt: req.query.end,
                    $gte: req.query.start
                }
            }
        } else {
            match = {};
        }
        Building.find({
                _id: {
                    $in: req.query.buildings
                }
            })
            .populate({
                path: 'data_entries',
                match: match, //THIS WORKS TO FILTER DATES
                select: 'id'
            })
            .exec(function (err, dataEntries) {
                var buildings = [];
                dataEntries.forEach(function(b){
                    buildings.push({name: b.name, building_id: b._id});
                });
                if (err) {
                    res.jsonp({
                        building: null
                    });
                } else {

                    let query = {_id: { $in: [].concat.apply([], dataEntries.map(d => d.data_entries))},
                                    meter_id: {  $in: [].concat.apply([], dataEntries.map(d => d.meters)) } };

                    DataEntry.find(query)
                    .select({
                        point: {
                            $elemMatch: {
                                name: "Accumulated Real Energy Net"
                            },
                        }
                    })
                    .sort('timestamp')
                    .select('meter_id timestamp point.value building')
                    .exec(function (err, datapoints) {

                        /*
                        datapoints: [
                            {
                                building: 5aab24bfdbdd3c325439a219,
                                timestamp: '2018-04-03 22:00:00',
                                point: [ { value: 1355244.13 } ]
                             }
                        ]
                        */
                    if (err) {
                        console.log(err);
                    } else {
                        var meters = [].concat.apply([], dataEntries.map(d => d.meters));

                        var temp = [];
                        meters.forEach(function (meter) {
                            var start = new Date(req.query.start);
                            var end = new Date(req.query.end);
                            var array = datapoints.filter(entry => entry.meter_id.toString() === meter.toString());
                            while (start.toISOString().substring(0, 10) < end.toISOString().substring(0, 10)) {
                                var daily = array.filter(x => {
                                    if (x)
                                        return x.timestamp.substring(0, 10) == start.toISOString().substring(0, 10);
                                });
                                if(daily.length>0){
                                    var end_index = 1;
                                    var start_index = 0;
                                    var val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                    // start by decreasing the end value
                                    var startflag = 0;
                                    while(val < 0 || val > 10000){
                                        if(startflag == 0){
                                            end_index += 1;
                                            if(daily[daily.length - end_index].point[0] && daily[start_index].point[0]){
                                                val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                            }
                                            startflag = 1;
                                        }
                                        else{
                                            start_index += 1;
                                            if(daily[daily.length - end_index].point[0] && daily[start_index].point[0]){
                                                val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                            }
                                            startflag = 0;
                                        }
                                    }
                                    temp.push({
                                        building_id : daily[0].building,
                                        meter_id: meter,
                                        date: daily[0].timestamp.substring(0, 10),
                                        val: val
                                    });
                                }
                                start.setDate(start.getDate() + 1);
                            }

                        });

                        //A check for Milne to Sum Values
                        if(buildings.filter(n => n.name === "Milne Computing Center").length > 0){
                            let milne_id = buildings.filter(n => n.name === "Milne Computing Center")[0].building_id;
                            // add values with common timestamps
                            let milne = temp.filter(d => d.building_id.toString() === milne_id.toString());
                            temp = temp.filter(d => d.building_id.toString() !== milne_id.toString());

                            let vals = milne.reduce((prev, curr) => {
                                let count = prev.get(curr.date) || 0;
                                prev.set(curr.date, curr.val + count);
                                return prev;
                            }, new Map());
                            [...vals].map(([key, value]) => {
                                return {key, value}
                            }).forEach(function(point){
                                temp.push({building_id: milne_id, date: point.key, val: point.value})
                            })
                        }
                        else if(buildings.filter(n => n.name === "Memorial Union").length > 0){
                            let union_id = buildings.filter(n => n.name === "Memorial Union")[0].building_id;
                            // add values with common timestamps
                            let union = temp.filter(d => d.building_id.toString() === union_id.toString());
                            temp = temp.filter(d => d.building_id.toString() !== union_id.toString());

                            let vals = union.reduce((prev, curr) => {
                                let count = prev.get(curr.date) || 0;
                                prev.set(curr.date, curr.val + count);
                                return prev;
                            }, new Map());
                            [...vals].map(([key, value]) => {
                                return {key, value}
                            }).forEach(function(point){
                                temp.push({building_id: union_id, date: point.key, val: point.value})
                            })
                        }
                        else if(buildings.filter(n => n.name === "Nash Hall").length > 0){
                            let nash_id = buildings.filter(n => n.name === "Nash Hall")[0].building_id;
                            // add values with common timestamps
                            let nash = temp.filter(d => d.building_id.toString() === nash_id.toString());
                            temp = temp.filter(d => d.building_id.toString() !== nash_id.toString());

                            let vals = nash.reduce((prev, curr) => {
                                let count = prev.get(curr.date) || 0;
                                prev.set(curr.date, curr.val + count);
                                return prev;
                            }, new Map());
                            [...vals].map(([key, value]) => {
                                return {key, value}
                            }).forEach(function(point){
                                temp.push({building_id: nash_id, date: point.key, val: point.value})
                            })
                        }
                        else if(buildings.filter(n => n.name === "Kelley Engineering Center").length > 0){
                            let kelley_id = buildings.filter(n => n.name === "Kelley Engineering Center")[0].building_id;
                            // add values with common timestamps
                            let kelley = temp.filter(d => d.building_id.toString() === kelley_id.toString());
                            temp = temp.filter(d => d.building_id.toString() !== kelley_id.toString());

                            let vals = kelley.reduce((prev, curr) => {
                                let count = prev.get(curr.date) || 0;
                                prev.set(curr.date, curr.val + count);
                                return prev;
                            }, new Map());
                            [...vals].map(([key, value]) => {
                                return {key, value}
                            }).forEach(function(point){
                                temp.push({building_id: kelley_id, date: point.key, val: point.value})
                            })
                        }
                        if(buildings.filter(n => n.name === "McNary Dining Center").length > 0){
                            getMcNaryDining(match)
                                .then(function(results){
                                    let vals = results.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        if(curr.val > count) {
                                            prev.set(curr.date, curr.val - count);
                                        }
                                        else{
                                            prev.set(curr.date, count - curr.val);
                                        }
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: buildings.filter(n => n.name === "McNary Dining Center")[0].building_id, date: point.key, val: point.value})
                                    });
                                    res.jsonp(temp);
                                })
                        }
                        else{
                            res.jsonp(temp);
                        }

                    }
                });
            }
        });

    });

    /**
     * Route for returning and rendering the story selection html page.
     * @name Story/get->storyNav
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {FILE}
     */
    app.get('/storyNav', function (req, res) {
        res.render('./story/story-selector.html'); // load the index.html file
    });

    /**
     * Route for returning a single line and returns the html file.
     * @name Building/get->singleLine
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path - Express path.
     * @param {callback} callback - Express middlewear.
     * @returns {FILE}
     */
    app.get('/singleLine', function (req, res) {
        res.render('./charts/single-building-line.html'); // load the index.html file
    });
    /**
     * Route for returning and rendering the login splash html page.
     * @name login/get->login
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path         - Express path.
     * @param {callback} callback   - Express middlewear.
     * @returns {FILE}
     */
    app.get('/login', function (req, res) {
        res.render('login.html'); // load the login.html file
    });

    /**
     * Route for returning a given users blocks.
     * @name Block/get->api/getUserBlocks
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path             - Express path.
     * @param {callback} callback       - Express middlewear.
     * @param {User} callback.req.user  - contains user to retrieve the blocks of.
     * @returns {Blocks[]}
     */
    app.get('/api/getUserBlocks', function (req, res) {
        User.findOne({
                _id: req.user._id
            })
            .populate({
                path: 'blocks',
                populate: {
                    path: 'building'
                }
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.blocks);
            });
    });

    /**
     * Route for returning an array of Blocks to populate a Dashboard
     * @name Block/get->api/getBlocksForDashboards
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path            - Express path.
     * @param {callback} callback      - Express middlewear.
     * @param {Object} callback.req    - Contains request data.
     * @param {User} callback.req.user - contains user to retrieve the blocks of.
     * @returns {Block[]}
     */
    app.get('/api/getBlocksForDashboards', function (req, res) {
        User.findOne({
                _id: req.user._id
            })
            .populate({
                path: 'blocks',
                populate: {
                    path: 'building',
                    select: 'id'
                }
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.blocks);
            });
    });

    /**
     * Route for returning all of the data entries assosciated with a building, given an id
     * @name Block/post->api/getBlocksForDashboards
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path            - Express path.
     * @param {callback} callback      - Express middlewear.
     * @param {Object} callback.req    - Contains request data.
     * @param {User} callback.req.user - contains user to add Block to.
     * @returns {Block[]}
     */
    app.post('/api/addBlock', function (req, res) {
        var user = req.user;
        var block = new Block();
        // set all of the relevant information
        block.name = req.body.name;
        block.created_by = user;
        block.building = req.body.buildings;
        block.is_public = req.body.is_public;
        block.chart = req.body.chart;
        block.variable = "Killowatts/Hr";
        // save the blocks
        block.save(function (err, savedBlock) {
            if (err)
                throw err;

            else
                User.findByIdAndUpdate({
                    _id: user._id
                }, {
                    $push: {
                        blocks: savedBlock
                    }
                }, {
                    safe: true,
                    upsert: true,
                    new: true
                }, function (err, user) {
                    if (err)
                        throw (err);
                    else {
                        res.json(user);
                    }
                });
        });
    });

     /**
     * Route for deleting a block from the database and the user's assosciation
     * @name Block/post->api/deleteBlock
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path              - Express path.
     * @param {callback} callback        - Express middlewear.
     * @param {Object} callback.req      - Contains request data.
     * @param {User} callback.req.user   - contains user to delete block from
     * @param {Block} callback.req.body  - contains Block to delete
     * @returns {String}
     */
    app.post('/api/deleteBlock', function (req, res) {
        User.findByIdAndUpdate({
            _id: req.user._id
        }, {
            $pull: {
                blocks: req.body._id
            }
        }, function (err, user) {
            if (err)
                throw (err);
            else {
                Block.remove({
                    _id: req.body._id
                }, function (err) {
                    if (err) return handleError(err);
                    res.json({
                        message: "success"
                    });
                });
            }
        });

    });

    /**
     * Route for retrieving a block given an id.
     * @name Block/get->api/deleteBlock
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                             - Express path.
     * @param {callback} callback                       - Express middlewear.
     * @param {Object} callback.req                     - Contains request data.
     * @param {Object} callback.req.query               - Contains passed query.
     * @param {String} callback.req.query.block_id      - The id of the block being retrieved.
     * @returns {Block}
     */
    app.get('/api/getBlockById', function (req, res) {
        Block.findOne({
                _id: req.query.block_id
            })
            .populate({
                path: 'building'
            })
            .exec(function (err, block) {
                if (err) return handleError(err);
                res.json(block);
            });
    });

    /**
     * Route for updating a block given an id.
     * @name Block/post->api/updateBlock
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                         - Express path.
     * @param {callback} callback                   - Express middlewear.
     * @param {Object} callback.req                 - Contains request data.
     * @param {Object} callback.req.body            - Contains passed query.
     * @param {String} callback.req.body.name       - The new name of the block.
     * @param {Chart} callback.req.body.chart       - The new chart data.
     * @param {String} callback.req.body.building   - The id of the assosciated building.
     * @param {Boolean} callback.req.body.is_public - The bool to determine if the public can view it.
     * @param {String} callback.req.body.variable   - The unit being measured.
     * @returns {Block}
     */
    app.post('/api/updateBlock', function (req, res) {
        Block.findByIdAndUpdate({
            _id: req.body._id
        }, {
            $set: {
                'name': req.body.name,
                'chart': req.body.chart,
                'building': req.body.building,
                'is_public': req.body.is_public,
                'variable': req.body.variable
            }
        }, {
            safe: true,
            upsert: true,
            new: true
        }, function (err, block) {
            if (err)
                throw (err);
            else {
                res.json(block);
            }
        });
    });

    /**
     * Route for adding a new dashboard from the application interface.
     * @name Dashboard/post->api/addDashboard
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                             - Express path.
     * @param {callback} callback                       - Express middlewear.
     * @param {Object} callback.req                     - Contains request data.
     * @param {Object} callback.req.body                - Contains passed query.
     * @param {String} callback.req.body.name           - The name of the new dashboard.
     * @param {String} callback.req.body.description    - The description of the new dashboard.
     * @param {String} callback.req.body.user           - The user who created the dashboard.
     * @param {Boolean} callback.req.body.is_public     - The bool that determines if the public can see it or not.
     * @param {Block[]} callback.req.body.blocks        - The array of Blocks to add to Dashboard.
     * @returns {User}
     */
    app.post('/api/addDashboard', function (req, res) {
        var user = req.user;
        var dashboard = new Dashboard();
        dashboard.name = req.body.name;
        dashboard.description = req.body.description;
        dashboard.created_by = user;
        dashboard.is_public = req.body.is_public,
            dashboard.blocks = req.body.blocks;

        dashboard.save(function (err, savedDashboard) {
            if (err)
                throw err;
            else
                User.findByIdAndUpdate({
                    _id: user._id
                }, {
                    $push: {
                        dashboards: savedDashboard
                    }
                }, {
                    safe: true,
                    upsert: true,
                    new: true
                }, function (err, user) {
                    if (err)
                        throw (err);
                    else {
                        res.json(user);
                    }
                });
        });
    });

    /**
     * Route for returning a given users dashboards.
     * @name Dashboard/get->api/getDashboards
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path             - Express path.
     * @param {callback} callback       - Express middlewear.
     * @param {Object} callback.req     - Contains query.
     * @param {User} callback.req.user  - contains user to retrieve the Dashboards of.
     * @returns {Dashboard[]}
     */
    app.get('/api/getDashboards', isLoggedIn, function (req, res) {
        User.findOne({
                _id: req.user._id
            })
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
                if (err) {
                    console.log("Error");
                };
                res.json(user.dashboards);
            });
    });

    /**
     * Route for returning the Dashboards labeled public.
     * @name Dashboard/get->api/getPublicDashboards
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path             - Express path.
     * @param {callback} callback       - Express middlewear.
     * @param {Object} callback.req     - Contains query.
     * @param {User} callback.req.user  - contains user to retrieve the Dashboards of.
     * @returns {Dashboard[]}
     */
    app.get('/api/getPublicDashboards', function (req, res) {
        Dashboard.find({
                is_public: true
            })
            .populate({
                path: 'blocks',
                populate: {
                    path: 'building',
                    select: 'id name'
                }
            })
            .exec(function (err, dashboards) {
                if (err) {
                    console.log("Error");
                };
                res.json(dashboards);
            });
    });
    /**
     * Route for getting the names of a given User's Dashboards.
     * @name Dashboard/get->api/getDashboardNames
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path             - Express path.
     * @param {callback} callback       - Express middlewear.
     * @param {Object} callback.req     - Contains query.
     * @param {User} callback.req.user  - contains user to retrieve the Dashboards of.
     * @returns {Dashboard[]}
     */
    app.get('/api/getDashboardNames', isLoggedIn, function (req, res) {
        User.findOne({
                _id: req.user._id
            })
            .populate({
                path: 'dashboards',
                select: 'name'
            })
            .exec(function (err, user) {
                if (err) {
                    console.log("Error");
                };
                res.json(user.dashboards);
            });
    });

    /**
     * Route for deleting a Dashboard given a user id.
     * @name Dashboard/post->api/deleteDashboard
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {User} callback.req.user      - contains user to delete the Dashboard from.
     * @param {Dashboard} callback.req.body - contains the Dashboard to delete.
     * @returns {String}
     */
    app.post('/api/deleteDashboard', function (req, res) {
        User.findByIdAndUpdate({
            _id: req.user._id
        }, {
            $pull: {
                dashboards: req.body._id
            }
        }, function (err) {
            if (err)
                throw (err);
            else {
                Dashboard.remove({
                    _id: req.body._id
                }, function (err) {
                    if (err) return handleError(err);
                    res.json({
                        message: "success"
                    });
                });
            }
        });
    });

     /**
     * Route for updating a Dashboard given the Dashboard.
     * @name Dashboard/post->api/updateDashboard
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {Dashboard} callback.req.body - Contains Dashboard.
     * @returns {Dashboard}
     */
    app.post('/api/updateDashboard', function (req, res) {
        Dashboard.findByIdAndUpdate({
            _id: req.body._id
        }, {
            $set: {
                'name': req.body.name,
                'description': req.body.description,
                'is_public': req.body.is_public,
                'blocks': req.body.blocks,
            }
        }, {
            safe: true,
            upsert: true,
            new: true
        }, function (err, dash) {
            if (err)
                throw (err);
            else {
                res.json(dash);
            }
        });
    });

    /**
     * Route for getting stories given a User id.
     * @name Story/get->api/getUserStories
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path             - Express path.
     * @param {callback} callback       - Express middlewear.
     * @param {Object} callback.req     - Contains query.
     * @param {User} callback.req.user  - Contains User to retrieve stories..
     * @returns {Story[]}
     */
    app.get('/api/getUserStories', isLoggedIn, function (req, res) {
        User.findOne({
                _id: req.user._id
            })
            .populate({
                path: 'stories',
                populate: {
                    path: 'dashboards',
                    populate: {
                        path: 'blocks',
                        populate: {
                            path: 'building',
                            select: 'name'
                        }
                    }
                }
            })
            .exec(function (err, user) {
                if (err) return handleError(err);
                res.json(user.stories);
            });
    });

    /**
     * Route for adding a Story to a given User.
     * @name Story/post->api/addStory
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path               - Express path.
     * @param {callback} callback         - Express middlewear.
     * @param {Object} callback.req       - Contains query.
     * @param {User} callback.req.user    - Contains User.
     * @param {Story} callback.req.body   - Contains Story to add to user.
     * @returns {User}
     */
    app.post('/api/addStory', function (req, res) {
        var user = req.user;
        var story = new Story();
        story.name = req.body.name;
        story.is_public = req.body.is_public;
        story.created_by = user;
        story.dashboards = req.body.dashboards;

        story.save(function (err, savedStory) {
            if (err)
                throw err;
            else
                console.log(savedStory);
            User.findByIdAndUpdate({
                _id: user._id
            }, {
                $push: {
                    stories: savedStory
                }
            }, {
                safe: true,
                upsert: true,
                new: true
            }, function (err, user) {
                if (err)
                    throw (err);
                else {
                    res.json(user);
                }
            });
        });
    });

    /**
     * Route for updating a Story.
     * @name Story/post->api/updateStory
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {Story} callback.req.body     - Contains Story to add to user
     * @returns {Story}
     */
    app.post('/api/updateStory', function (req, res) {
        Story.findByIdAndUpdate({
            _id: req.body._id
        }, {
            $set: {
                'dashboards': req.body.dashboards,
                'is_public': req.body.is_public,
                'name': req.body.name
            }
        }, {
            safe: true,
            upsert: true,
            new: true
        }, function (err, story) {
            if (err)
                throw (err);
            else {
                res.json(story);
            }
        });
    });

    /**
     * Route for deleting a Story.
     * @name Story/post->api/deleteStory
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {Story} callback.req.body     - Contains Story to delete
     * @returns {Story}
     */
    app.post('/api/deleteStory', function (req, res) {
        User.findByIdAndUpdate({
            _id: req.user._id
        }, {
            $pull: {
                stories: req.body._id
            }
        }, function (err) {
            if (err)
                throw (err);
            else {
                Story.remove({
                    _id: req.body._id
                }, function (err) {
                    if (err) return handleError(err);
                    res.json({
                        message: "success"
                    });
                });
            }
        });
    });

    /**
     * Route for retrieving public Stories.
     * @name Story/get->api/getPublicStories
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @returns {Story[]}
     */
    app.get('/api/getPublicStories', function (req, res) {
        Story.find({
                is_public: true
            })
            .populate({
                path: 'dashboards',
                populate: {
                    path: 'blocks',
                    populate: {
                        path: 'building',
                        select: 'name'
                    }
                }

            })
            .exec(function (err, stories) {
                if (err) {
                    console.log("Error");
                };
                res.json(stories);
            });
    });

    /**
     * Route for adding a Meter.
     * @name Meter/post->api/addMeter
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {User} callback.req.user      - Contains the User who added the Meter.
     * @param {Meter} callback.req.body     - Contains the Meter to add.
     * @returns {Meter}
     */
    app.post('/api/addMeter', function (req, res) {
        var user = req.user;
        var meter = new Meter();
        meter.name = req.body.name;
        meter.meter_id = req.body.meter_id;
        meter.building = null;
        meter.save(function (err, savedMeter) {
            if (err)
                throw err;
            else
                res.json(savedMeter);
        });
    });

    /**
     * Route for retrieving Meters.
     * @name Meter/get->api/getMeters
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @returns {Meter[]}
     */
    app.get('/api/getMeters', function (req, res) {
        Meter.find({})
            .populate({
                path: 'building',
                select: 'name building_type meters'
            })
            .exec(function (err, meters) {
                if (err) return handleError(err);
                res.json(meters);
            });
    });

     /**
     * Route for retrieving a Meter given an id.
     * @name Meter/get->api/getMeterById
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                           - Express path.
     * @param {callback} callback                     - Express middlewear.
     * @param {Object} callback.req                   - Contains query.
     * @param {String} callback.req.query.meter_id    - Contains Meter being retrieved..
     * @returns {Meter}
     */
    app.get('/api/getMeterById', function (req, res) {
        Meter.findOne({
                _id: req.query.meter_id
            })
            .populate({
                path: 'building'
            })
            .exec(function (err, meter) {
                if (err) return handleError(err);
                res.json(meter);
            });
    });

      /**
     * Route for updating a Meter.
     * @name Meter/post->api/updateMeter
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {Meter} callback.req.body     - Contains the Meter to update.
     * @returns {Meter}
     */
    app.post('/api/updateMeter', function (req, res) {
        Meter.findByIdAndUpdate({
            _id: req.body.id
        }, {
            $set: {
                'meter_id': req.body.meter_id,
                'name': req.body.name
            }
        }, {
            safe: true,
            upsert: true,
            new: true
        }, function (err, meter) {
            if (err)
                throw (err);
            else {
                res.json(meter);
            }
        });
    });

    /**
     * Route for deleting a Meter.
     * @name Meter/post->api/addMeter
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                 - Express path.
     * @param {callback} callback           - Express middlewear.
     * @param {Object} callback.req         - Contains query.
     * @param {Meter} callback.req.body     - Contains the Meter to delete.
     * @returns {Meter}
     */
    app.post('/api/deleteMeter', function (req, res) {
        Meter.remove({
            _id: req.body._id
        }, function (err) {
            if (err) return handleError(err);
            Building.findOneAndUpdate({
                _id: req.body.building
            }, {
                $pull: {
                    meters: req.body._id
                }
            }, () => res.json({
                message: "success"
            }));
        });
    });


    /**
     * Route for emailing and updating user credentials based on query.
     * @name Email/post->api/emailRegistration
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {string} path                     - Express path.
     * @param {callback} callback               - Express middlewear.
     * @param {Object} callback.req             - Contains query.
     * @param {Object} callback.req.body        - Contains an object with email and user info.
     * @param {String} callback.req.body.email  - Contains the email address.
     * @param {String} callback.req.body.access - Contains the User's new account access level.
     * @returns {String}
     */
    app.post('/api/emailRegistration', function (req, res) {
        AWS.config.update({
            region: 'us-west-2'
        });
        var credentials = new AWS.EnvironmentCredentials('AWS');
        credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID
        credentials.secretAccessKey = process.env.SECRET_ACCESS_KEY
        AWS.config.credentials = credentials;
        console.log(req.body);
        console.log('Something');
        User.findOneAndUpdate({
            'google.email': req.body.email
        }, {
            $set: {
                accountAccess: req.body.access
            }
        }, {
            upsert: true,
            new: true
        }, (err, doc) => {
            console.log('callback')
            if (err) throw err;
            if (doc) {
                console.log(doc);
                if (doc.accountAccess !== req.body.access) {
                    console.log(doc)
                }
                
            }
        });
        var params = {
            Destination: { /* required */
                CcAddresses: [],
                ToAddresses: [req.body.email]
            },

            Message: { /* required */
                Body: { /* required */
                    Html: {
                        Charset: "UTF-8",
                        Data: "<h1>This is an E-mail from the application</h1><br> <h4>Please click the link below to be taken there.</h4><br>" +
                            "<a href=\"http://localhost:3000/login/\">Click me!</a>"
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "TEXT_FORMAT_BODY"
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Test email from AWS'
                }
            },
            Source: process.env.TEST_EMAIL_USER,
            /* required */
            ReplyToAddresses: [],
        };
        var sendPromise = new AWS.SES({
            apiVersion: '2010-12-01'
        }).sendEmail(params).promise();

        // Handle promise's fulfilled/rejected states
        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
            function (err) {
                console.error(err, err.stack);
            });
        res.json({
            message: "success"
        });
    });

     /**
     * Route for Google Authentication. Send to google to do the authentication.
     * Profile gets us their basic information including their name.
     * Email gets their emails.
     * @name Google/get->auth/google
     * @function
     * @memberof module:PublicServer
     * @inner
     * @fires Google/get->auth/google/callback
     * @returns {callback}
     */
    app.get('/auth/google',
        passport.authenticate('google', {
            scope: ['profile', 'email']
        })
    );

     /**
     * Route for Google Authentication, the callback after google has authenticated the user.
     * Redirects User on success/failure.
     * @name Google/get->auth/google
     * @function
     * @memberof module:PublicServer
     * @inner
     * @returns {FILE}
     */
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/login'
        })
    );
    
    /**
     * Route for logging a User out of their Google account.
     * @name Google/get->logout
     * @function
     * @memberof module:PublicServer
     * @inner
     * @returns {FILE}
     */
    app.get('/logout', function (req, res) {
        req.session.destroy(function (e) {
            req.logout();
            res.redirect('/');
        });
    });
    /**
     * Route for exporting building data to a csv file.
     * @name Building/post->api/toCSV
     * @function
     * @memberof module:PublicServer
     * @inner
     * @param {String[]} callback.req.query.buildings   - Array of building ids.
     * @param {String} callback.req.query.start         - Start time to filter.
     * @param {String} callback.req.query.end           - End time to filter.
     * @returns {FILE}
     */
    app.post('/api/toCSV', function (req, res) {

        var match;
        if (req.query && req.query.start && req.query.end) {
            match = {
                timestamp: {
                    $lt: req.query.end,
                    $gte: req.query.start
                }
            }
        } else {
            match = {};
        }

        Building.find({
            _id: {
                $in: req.query.buildings
            }
        })
            .populate({
                path: 'data_entries',
                match: match, //THIS WORKS TO FILTER DATES
                select: 'id'
            })
            .exec(function (err, dataEntries) {
                var buildings = [];
                dataEntries.forEach(function(b){
                    buildings.push({name: b.name, building_id: b._id});
                });
                if (err) {
                    res.jsonp({
                        building: null
                    });
                } else {
                    DataEntry.find({
                        _id: {
                            $in: [].concat.apply([], dataEntries.map(d => d.data_entries))
                        },
                        meter_id: {
                            $in: [].concat.apply([], dataEntries.map(d => d.meters))
                        }
                    })
                        .select({
                            point: {
                                $elemMatch: {
                                    name: "Accumulated Real Energy Net"
                                },
                            }
                        })
                        .sort('timestamp')
                        .select('meter_id timestamp point.value building')
                        .exec(function (err, datapoints) {

                            /*
                            datapoints: [
                                {
                                    building: 5aab24bfdbdd3c325439a219,
                                    timestamp: '2018-04-03 22:00:00',
                                    point: [ { value: 1355244.13 } ]
                                 }
                            ]
                            */
                            if (err) {
                                console.log(err);
                            } else {
                                var meters = [].concat.apply([], dataEntries.map(d => d.meters));

                                var temp = [];
                                meters.forEach(function (meter) {
                                    var start = new Date(req.query.start);
                                    var end = new Date(req.query.end);
                                    var array = datapoints.filter(entry => entry.meter_id.toString() === meter.toString());
                                    while (start.toISOString().substring(0, 10) < end.toISOString().substring(0, 10)) {
                                        var daily = array.filter(x => {
                                            if (x)
                                                return x.timestamp.substring(0, 10) == start.toISOString().substring(0, 10);
                                        });
                                        if(daily.length>0){
                                            var end_index = 1;
                                            var start_index = 0;
                                            var val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                            // start by decreasing the end value
                                            var startflag = 0;
                                            while(val < 0 || val > 10000){
                                                if(startflag == 0){
                                                    end_index += 1;
                                                    if(daily[daily.length - end_index].point[0] && daily[start_index].point[0]){
                                                        val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                                    }
                                                    startflag = 1;
                                                }
                                                else{
                                                    start_index += 1;
                                                    if(daily[daily.length - end_index].point[0] && daily[start_index].point[0]){
                                                        val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                                    }
                                                    startflag = 0;
                                                }
                                            }
                                            temp.push({
                                                building_id : daily[0].building,
                                                meter_id: meter,
                                                date: daily[0].timestamp.substring(0, 10),
                                                val: val
                                            });
                                        }
                                        start.setDate(start.getDate() + 1);
                                    }

                                });

                                //A check for Milne to Sum Values
                                if(buildings.filter(n => n.name === "Milne Computing Center").length > 0){
                                    let milne_id = buildings.filter(n => n.name === "Milne Computing Center")[0].building_id;
                                    // add values with common timestamps
                                    let milne = temp.filter(d => d.building_id.toString() === milne_id.toString());
                                    temp = temp.filter(d => d.building_id.toString() !== milne_id.toString());

                                    let vals = milne.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        prev.set(curr.date, curr.val + count);
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: milne_id, date: point.key, val: point.value})
                                    })
                                }
                                else if(buildings.filter(n => n.name === "Memorial Union").length > 0){
                                    let union_id = buildings.filter(n => n.name === "Memorial Union")[0].building_id;
                                    // add values with common timestamps
                                    let union = temp.filter(d => d.building_id.toString() === union_id.toString());
                                    temp = temp.filter(d => d.building_id.toString() !== union_id.toString());

                                    let vals = union.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        prev.set(curr.date, curr.val + count);
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: union_id, date: point.key, val: point.value})
                                    })
                                }
                                else if(buildings.filter(n => n.name === "Nash Hall").length > 0){
                                    let nash_id = buildings.filter(n => n.name === "Nash Hall")[0].building_id;
                                    // add values with common timestamps
                                    let nash = temp.filter(d => d.building_id.toString() === nash_id.toString());
                                    temp = temp.filter(d => d.building_id.toString() !== nash_id.toString());

                                    let vals = nash.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        prev.set(curr.date, curr.val + count);
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: nash_id, date: point.key, val: point.value})
                                    })
                                }
                                else if(buildings.filter(n => n.name === "Kelley Engineering Center").length > 0){
                                    let kelley_id = buildings.filter(n => n.name === "Kelley Engineering Center")[0].building_id;
                                    // add values with common timestamps
                                    let kelley = temp.filter(d => d.building_id.toString() === kelley_id.toString());
                                    temp = temp.filter(d => d.building_id.toString() !== kelley_id.toString());

                                    let vals = kelley.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        prev.set(curr.date, curr.val + count);
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: kelley_id, date: point.key, val: point.value})
                                    })
                                }
                                else if(buildings.filter(n => n.name === "McNary Hall").length > 0){
                                    let mcnary_id = buildings.filter(n => n.name === "McNary Hall")[0].building_id;
                                    // add values with common timestamps
                                    let mcnary = temp.filter(d => d.building_id.toString() === mcnary_id.toString());
                                    temp = temp.filter(d => d.building_id.toString() !== mcnary_id.toString());

                                    let vals = mcnary.reduce((prev, curr) => {
                                        let count = prev.get(curr.date) || 0;
                                        prev.set(curr.date, curr.val + count);
                                        return prev;
                                    }, new Map());
                                    [...vals].map(([key, value]) => {
                                        return {key, value}
                                    }).forEach(function(point){
                                        temp.push({building_id: mcnary_id, date: point.key, val: point.value})
                                    })
                                }

                                res.jsonp(temp);
                            }
                        });
                }
            });
    });

    // Function to simply iteratively change any negative values in DataEntries
    // into postive numbers.
    // app.post('/updateNegativeDBValues', async (req, res) => {
    //     let finalArray = await DataEntry.find({
    //         point: {
    //             $elemMatch: {
    //                 value: {
    //                     $lt: 0
    //                 }
    //             }
    //         }
    //     }).limit(8000).exec(async (err, docs) => {
    //         for (let i = 0; i < docs.length; i++) {
    //             for (let j = 0; j < docs[i].point.length; j++) {
    //                 docs[i].point[j].value = Math.abs(docs[i].point[j].value);
    //             }
    //         }
    //     });

    //     for (let i = 0; i < finalArray.length; i++) {
    //         DataEntry.findByIdAndUpdate({
    //             _id: finalArray[i]._id
    //         }, {
    //             $set: {
    //                 point: finalArray[i].point
    //             }
    //         }, (err, doc) => {
    //             if (err) {
    //                 console.log(err);
    //             }
    //         });
    //     }
    //     res.jsonp(200);
    // });

    // app.post('/moveMeterReferences', async (req,res) => {
    //     let oldMeters = [];
    //     let newMeters = [];
    //     let asyncMeter = await Meter.find((err,docs) => {

    //         for (let i = 0; i < docs.length; i++) {
    //             if(docs[i].meter_id.substr(-2) === '_1'){
    //                 newMeters.push(docs[i]);
    //             }
    //         }
    //         // console.log(newMeters);
    //         for (let j = 0; j < newMeters.length; j++) { 
    //             for (let k = 0; k < docs.length; k++){
    //                 if(newMeters[j].meter_id === docs[k].meter_id + '_1'){
    //                     oldMeters.push(docs[k]);
    //                 }
    //             }
    //         }
    //     });
    //     console.log(oldMeters[0]);
    //     console.log(newMeters[0]);
    //     for (let i = 0; i < newMeters.length; i++) { 
    //         DataEntry.updateMany({meter_id: oldMeters[i]},{$set: {meter_id: newMeters[i]}});
    //     }
    //     res.jsonp(200);
    // });
}

/**
 * Function to update a Building's Meter's when that specific Building is Edited. Also called when new Building is created with in use meters.
 * @param  {String[]} meter     - Array of Meter IDs
 * @param  {Building} building  - Building to check and remove meters from
 * @function
 * @memberof module:PublicServer
 * @inner
 * @returns {PROMISE}
 */
function updateOldBuildingMeters(meter, building) {
    return new Promise((resolve, reject) => {

        Building.findOneAndUpdate({
            meters: {
                "$in": [meter]
            },
            "_id": {
                $ne: building._id
            }
        }, {
            $pull: {
                meters: meter
            }
        }, function (err, oldBuilding) {
            if (err) {
                reject(err);
            } else {
                if (oldBuilding) {
                    console.log("Old Building '" + oldBuilding.name + "' has had the following meter removed: " + meter);
                }
                resolve();
            }
        });
    });

}
/**
 * Function for adding Meters to a building.
 * @param  {String} meter           - id of Meter being added.
 * @param  {String} savedBuilding   - id of Building being added to.
 * @function
 * @memberof module:PublicServer
 * @inner
 * @fires pushNullMeter
 * @return {Promise}
 */
function addMeter(meter, savedBuilding) {
    return new Promise((resolve, reject) => {
        pushNullMeter(meter, savedBuilding)
            .then(() => {
                Meter.findByIdAndUpdate({
                    _id: meter
                }, {
                    $set: {
                        building: savedBuilding
                    }
                }, {
                    safe: true,
                    upsert: true,
                    new: true
                }, (err, meter) => {
                    if (err) {
                        reject(err)
                    } else {
                        console.log("Meter: " + meter.name + " set building to: " + savedBuilding.name);
                        resolve(savedBuilding);
                    }
                })
            });
    })
}
/**
 * Function for adding retrieving McNary Dining specifically because it has special properties.
 * @param  {Object} match  - timestamp to crosscheck McNary entries..
 * @function
 * @memberof module:PublicServer
 * @inner
 * @fires pushNullMeter
 * @return {Promise}
 */
function getMcNaryDining(match){
    return new Promise((resolve, reject) => {
    Meter.find({meter_id: { $in: ['001EC60527B4_1', '001EC60527B4_2']}})
        .select('_id')
        .exec(function (err, meters){
            if (err) {
                console.log(err);
            } else {
                DataEntry.find({
                    meter_id: {
                        $in: meters
                    },
                    "timestamp": {"$gte": match.timestamp.$gte, "$lt": match.timestamp.$lt}
                })
                .select({
                    point: {
                        $elemMatch: {
                            name: "Accumulated Real Energy Net"
                        },
                    }
                })
                .sort('timestamp')
                .select('meter_id timestamp point.value building')
                .exec(function (err, datapoints) {

                    if (err) {
                        console.log(err);
                    } else {
                        var temp = [];
                        console.log(meters);
                        meters.forEach(function (meter) {
                            var start = new Date(match.timestamp.$gte);
                            var end = new Date(match.timestamp.$lt);
                            var array = datapoints.filter(entry => entry.meter_id.toString() === meter._id.toString());
                            console.log(array);
                            while (start.toISOString().substring(0, 10) < end.toISOString().substring(0, 10)) {
                                var daily = array.filter(x => {
                                    if (x)
                                        return x.timestamp.substring(0, 10) == start.toISOString().substring(0, 10);
                                });
                                if (daily.length > 0) {
                                    var end_index = 1;
                                    var start_index = 0;
                                    var val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                    // start by decreasing the end value
                                    var startflag = 0;
                                    while (val < 0 || val > 10000) {
                                        if (startflag == 0) {
                                            end_index += 1;
                                            if (daily[daily.length - end_index].point[0] && daily[start_index].point[0]) {
                                                val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                            }
                                            startflag = 1;
                                        }
                                        else {
                                            start_index += 1;
                                            if (daily[daily.length - end_index].point[0] && daily[start_index].point[0]) {
                                                val = Math.abs(daily[daily.length - end_index].point[0].value) - Math.abs(daily[start_index].point[0].value);
                                            }
                                            startflag = 0;
                                        }
                                    }
                                    temp.push({
                                        building_id: daily[0].building,
                                        meter_id: meter,
                                        date: daily[0].timestamp.substring(0, 10),
                                        val: val
                                    });
                                }
                                start.setDate(start.getDate() + 1);
                            }

                        });
                        console.log(temp);
                        resolve(temp);
                    }
                });
            }
        });

    });

}
/**
 * Function that adds DataEntries to a Building when the Meter is first added to that Building.
 * @param  {String} meter           - id of Meter being added.
 * @param  {String} savedBuilding   - id of Building being added to.
 * @function
 * @memberof module:PublicServer
 * @inner
 * @return {Promise}
 */
function pushNullMeter(meter, savedBuilding) {
    // DataEntry.update({building: null}, {$set: {building: savedBuilding}});
    return new Promise((resolve, reject) => {
        Meter.findById(meter, (err, doc) => {
            if (doc === null || doc === undefined) {
                console.log('Unable to find meter in pushNullData entries for meter id: ' + meter);
                reject();
            }
            // await Meter.updateMany({building:req.body._id},{$set: {building: null}})

            if (doc.building == null) {
                console.log('The meter "' + meter + '" has its building set to null, pushing stored data entries')
                DataEntry.find({
                    meter_id: meter
                }, (err, docs) => {
                    if (err) {
                        console.log('Unable to push null data entries for meter id: ' + meter)
                        reject();
                    } else {
                        Building.findOneAndUpdate({
                                _id: savedBuilding._id
                            }, {
                                $push: {
                                    data_entries: {
                                        $each: docs
                                    }
                                }
                            }, {
                                safe: true,
                                upsert: true,
                                new: true
                            },
                            (err) => {
                                if (err) throw (err)
                            });
                    }

                });
                DataEntry.updateMany({
                        meter_id: meter
                    }, {
                        $set: {
                            building: savedBuilding._id
                        }
                    },
                    (err) => {
                        if (err) throw (err)
                    });
            }
        });
        resolve();
    });

}

/**
 * Route middleware to make sure a user is logged in
 * @function
 * @memberof module:PublicServer
 * @inner
 * @return {callback}
 */
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
}

function saveBlock(blockData) {

}

