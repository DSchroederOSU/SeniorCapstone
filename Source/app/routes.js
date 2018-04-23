require('mongoose');
require('mongodb')
const Json2csvParser = require('json2csv').Parser;
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
var blackList = ['$', '{', '&&', '||']
var options = {
    urlBlackList: blackList,
    bodyBlackList: blackList
};

var dataMethods = require('../public/js/buildingData');
module.exports = function (app, passport) {
    app.use(filter(options));
    app.get('/', function (req, res) {

        return res.render('./index.html'); // load the index.html file
    });

    app.get('/api/google_user', function (req, res) {
        if (req.user) {
            res.json(req.user.google);
        } else {
            res.send(null)
        }


    });


    // =====================================================================
    ///////////////////////////////BUILDING API/////////////////////////////
    // =====================================================================
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

    app.post('/api/updateBuilding', function (req, res) {
        console.log(req.body);
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

                // updateOldBuildingMeters(req.body.meters[i],req.body).then(console.log('hi'));

            }
        });
        res.json(req.body);
    });

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
                console.log(dataEntries[0].meters);
                if(dataEntries[0].name == 'Milne Computing Center' || dataEntries[0].name == 'Memorial Union' || dataEntries[0].name == 'Nash Hall'){
                    dataMethods.add_meters(dataEntries[0].meters, req.query.start, req.query.end).then(function(data){
                        res.jsonp({building: req.query.buildings, data: data});
                    });

                }else {
                    console.log("------");
                    if (err) {
                        res.jsonp({
                            building: null
                        });
                    } else {
                        DataEntry.find({
                            _id: {
                                $in: [].concat.apply([], dataEntries.map(d => d.data_entries))
                            }
                        })
                            .select({
                                point: {
                                    $elemMatch: {
                                        name: "Accumulated Real Energy Net"
                                    },
                                }
                            })
                            .select('-_id timestamp point.value building')
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
                                    res.jsonp({
                                        building: null
                                    });
                                } else {
                                    var to_return = [];
                                    var b_array = [];

                                    //if only one building is being charted,
                                    //the value is a string not an array, needs to be handled
                                    if (typeof req.query.buildings == 'string') {
                                        b_array.push(req.query.buildings);
                                    } else {
                                        b_array = req.query.buildings
                                    }
                                    if (b_array && req.query.buildings.length > 1 && dataEntries != '[]') {
                                        b_array.forEach(function (building_id) {
                                            to_return.push({
                                                id: building_id,
                                                points: datapoints.filter(entry => entry.building == building_id).map(x => {
                                                    if (x.point.length != 0)
                                                        return {
                                                            building: x.building,
                                                            timestamp: x.timestamp,
                                                            point: x.point[0].value
                                                        }
                                                })
                                            });
                                        });
                                    } else {
                                        to_return.push({
                                            id: req.query.buildings,
                                            points: datapoints.filter(entry => entry.building == req.query.buildings).map(x => {
                                                if (x.point.length != 0)
                                                    return {
                                                        building: x.building,
                                                        timestamp: x.timestamp,
                                                        point: x.point[0].value
                                                    }
                                            })
                                        });
                                    }
                                    /*
                                    This returns a structure like this to the client
                                    to_return: [
                                        {
                                            id: building_id,
                                            points: [ {building: building_id, timestamp: timestamp, value: 1355244.13 } ]
                                        },
                                        {
                                            id: building_id,
                                            points: [ {building: building_id, timestamp: timestamp, value: 1355244.13 } ]
                                        },
                                    ]
                                    */
                                    console.log('Returning with value: ' + to_return);
                                    res.jsonp(to_return);
                                }
                            });
                    }
                }
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
        }, function (err, meter) {
            if (err)
                throw (err);
            else {
                res.json(meter);
            }
        });
    });

    // =====================================================================
    /////////////////////////////DASHBOARD API//////////////////////////////
    // =====================================================================
    app.post('/api/addDashboard', function (req, res) {
        console.log(req.body);
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

    app.post('/api/updateDashboard', function (req, res) {
        console.log(req.body);
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


    // =====================================================================
    ///////////////////////////////STORY API////////////////////////////////
    // =====================================================================
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

    app.post('/api/addStory', function (req, res) {
        console.log(req.body);
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
    app.post('/api/updateStory', function (req, res) {
        console.log(req.body);
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

    app.post('/api/deleteStory', function (req, res) {
        console.log(req.body);
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

    // =====================================================================
    /////////////////////////////METER API//////////////////////////////
    // =====================================================================
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

    app.get('/api/getMeters', function (req, res) {
        Meter.find({})
            .populate({
                path: 'building'
            })
            .exec(function (err, meters) {
                if (err) return handleError(err);
                res.json(meters);
            });
    });

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

    app.post('/api/updateMeter', function (req, res) {
        console.log(req.body);
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

    // sends out alert to users (admins) when a meter goes down.
    app.post('/api/emailAlert', function (req, res) {
        AWS.config.update({
            region: 'us-west-2'
        });
        var credentials = new AWS.EnvironmentCredentials('AWS');
        credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID
        credentials.secretAccessKey = process.env.SECRET_ACCESS_KEY
        AWS.config.credentials = credentials;
        var params = {
            Destination: { 
                CcAddresses: [],
                ToAddresses: [req.body.email]
            },

            Message: { 
                Body: { 
                    Html: {
                        Charset: "UTF-8",
                        Data: "<h1>This is an E-mail alert from the application</h1><br> <h4> Somthing went terribly wrong with one of the meters! </h4>"
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: "TEXT_FORMAT_BODY"
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'ALERT email from AWS'
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

    app.post('/api/emailRegistration', function (req, res) {
        AWS.config.update({
            region: 'us-west-2'
        });
        var credentials = new AWS.EnvironmentCredentials('AWS');
        credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID
        credentials.secretAccessKey = process.env.SECRET_ACCESS_KEY
        AWS.config.credentials = credentials;

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
    app.get('/logout', function (req, res) {
        req.session.destroy(function (e) {
            req.logout();
            res.redirect('/');
        });
    });
    app.post('/api/toCSV', function (req, res) {
        var match = {
            timestamp: {
                $lt: "2018-03-12",
                $gte: "2018-03-06"
            }
        };
        Building.find({
                _id: {
                    $in: req.body
                }
            })
            .populate({
                path: 'data_entries',
                match: match, //THIS WORKS TO FILTER DATES
                select: 'id'
            })
            .exec(function (err, dataEntries) {
                if (err || !dataEntries) {
                    res.json({
                        building: null
                    });
                } else {
                    DataEntry.find({
                            _id: {
                                $in: [].concat.apply([], dataEntries.map(d => d.data_entries))
                            }
                        })
                        .select({
                            point: {
                                $elemMatch: {
                                    name: "Accumulated Real Energy Net"
                                }
                            }
                        })
                        .select('-_id timestamp point.value building')
                        .exec(function (err, datapoints) {
                            if (err || datapoints == []) {
                                res.json({
                                    building: null
                                });
                            } else {

                                var to_return = [];
                                datapoints.forEach(function (d) {
                                    if (d.point[0]) {
                                        to_return.push([d.building, d.timestamp, d.point[0].value])
                                    }

                                });
                                const fields = ['building', 'timestamp', 'val'];
                                const json2csvParser = new Json2csvParser({
                                    fields
                                });
                                const csv = json2csvParser.parse(to_return);
                                res.send(to_return);
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

function pushNullMeter(meter, savedBuilding) {

    console.log(savedBuilding);
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

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
}

function saveBlock(blockData) {

}

