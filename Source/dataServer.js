// dataServer.js
// This is a seperate server that's dedicated to accepting data from acquisuites
// in real time.

// set up ======================================================================
// get all the tools we need
var dotenv = require('dotenv').config();
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var Building = require('./app/models/building-schema');
var Meter = require('./app/models/meter-schema');
var DataEntry = require('./app/models/data-entry-schema');
var fs = require('fs'); // TEMP - for saving acquisuite POST data\
var bodyParser = require('body-parser');
var morgan = require('morgan');
var xmlparser = require('express-xml-bodyparser');
var AWS = require('aws-sdk');
var moment = require('moment');
var math = require('mathjs');


var test = checkAverages()



// configuration ===============================================================
mongoose.connect(process.env.MONGO_DATABASE_URL, {
    useMongoClient: true
}); // connect to our database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to MongoDB");
});

// log every request to the console
app.use(morgan('dev'));

// Parse post bodies
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json()); // get information from html forms

var emailFlag = false;

// =====================================
// XML POST PARSING
// =====================================
// Function for handling xml post requests
// Receives post requests, converts from XML to JSON
// the 'xmlparser' in parameters converts XML to String
// then bodyParser converts this string to JSON

app.post('/receiveXML', xmlparser({
    trim: false,
    explicitArray: false
}), function (req, res) {
    if (req.body.das.mode === 'LOGFILEUPLOAD') {
        timestamp = moment().utc().format('HH:mm:ss');
        console.log('Received XML data on: ' + moment.utc().format('YYYY-MM-DD HH:mm:ss'));
        if (req.body.das.serial === '001EC60527B4') {
            console.log('McNary AcquiSuite Meter hit with address of ' + req.body.das.devices.device.address);
        }
        // calls email helper func once per day.
        if (emailFlag && timestamp > '00:00:00' && timestamp < '00:20:00') {
            console.log('Meters being reviewed for outage.')
            emailFlag = false;
            checkMeterTimestamps();
        } else if (!emailFlag && timestamp > '12:00:00' && timestamp < '12:15:00') {
            console.log('Email flag being reset');
            emailFlag = true;
        }
        pathShortener = req.body.das.devices.device.records;

        // Checks if meter exists. If it doesn't adds one.
        // Then/else adds incoming data entry
        Meter.findOne({
            meter_id: (req.body.das.serial + '_' + req.body.das.devices.device.address)
        }, (err, doc) => {
            if (!doc) {
                addMeter(req.body.das).then(data => addEntry(data, pathShortener, req.body.das));
            } else {
                addEntry(doc, pathShortener, req.body.das);
            }
        });
    } else {
        console.log('STATUS file received');
    }
    res.status("200");
    res.set({
        'content-type': 'text/xml',
        'Connection': 'close'
    });
    res.send("<?xml version='1.0' encoding='UTF-8' ?>\n" +
        "<result>SUCCESS</result>\n" +
        "<DAS></DAS>" +
        "</xml>");
});

// sends out alert to users (admins) when a meter goes down.
function emailAlert(email) {
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
            ToAddresses: [process.env.TEST_EMAIL_USER]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: email.body
                },
                Text: {
                    Charset: "UTF-8",
                    Data: "TEXT_FORMAT_BODY"
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: email.subject
            }
        },
        Source: process.env.TEST_EMAIL_USER,
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

}

// helper function to see when the last time a meter posted, sends alert if too long
function checkMeterTimestamps() {
    var yesterday = moment.utc().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var twoDaysAgo = moment.utc().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss');
    var meterCount = 0;
    var email = {
        body: '',
        subject: 'Meter(s) detected as offline!'
    }
    Meter.find().then(meters => {
        meters.forEach(e => {
            DataEntry.find({
                meter_id: e._id,
                timestamp: {
                    $gte: twoDaysAgo,
                    $lt: yesterday
                }
            }, (err, docs) => {
                if (!err) {
                    timestamps = docs.filter(t => {
                        return t.timestamp >= twoDaysAgo && t.timestamp <= yesterday
                    });
                    if (timestamps.length) {
                        email.body += `The meter named <b>"${e.name}"</b> with a serial of <b>"${e.meter_id}"</b> has not reported anything in 1-2 days. <br>`
                    }
                }
                if (meterCount++ == meters.length - 1 && email.body !== '') {
                    emailAlert(email);
                }
            })
        })
    })
}

// Function used to find and alert during high usage spikes
function checkAverages(meter_id) {
    var now = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    var yesterday = moment.utc().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var oneWeekAgo = moment.utc().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    var meterCount = 0;
    var email = {
        body: '',
        subject: 'Meter(s) detected as offline!'
    }
    Meter.find().then(meters => {
        meters.forEach(e => {
            DataEntry.find({
                meter_id: e._id,
                timestamp: {
                    $gte: oneWeekAgo,
                    $lt: now
                }
            }, (err, docs) => {
                pastData = docs.filter(t => {
                    return t.timestamp >= oneWeekAgo && t.timestamp <= yesterday
                });
                currentData = docs.filter(t => {
                    return t.timestamp >= yesterday && t.timestamp <= now
                });
                console.log(currentData)
                if (pastData.length){
                    pastDataArray = [];
                    for (i = 0; i < pastData.length; i++){
                        pastDataArray.push(pastData[i].point[0].value);
                    }
                    pastDataAvg = math.mean(pastDataArray);
                    console.log(pastDataAvg)
                    pastDataSD = math.std(pastDataArray);
                    pastDataThreshhold = pastDataAvg + pastDataSD;
                    if (currentData.length) {
                        currentDataArray = [];
                        for (i = 0; i <  currentData.length; i++){
                            currentDataArray.push( currentData[i].point[0].value);
                        }
                        currentDataAvg = math.mean( currentDataArray);
                        console.log( currentDataAvg)
                        currentDataSD = math.std(currentDataArray);
                    }
            }
            });
        });
    });
}

function addMeter(meter) {
    return new Promise((resolve, reject) => {
        newmeter = new Meter({
            name: meter.devices.device.name,
            meter_id: (meter.serial + '_' + meter.devices.device.address),
            building: null
        });
        console.log('New meter "' + newmeter.name + '" has been added.')
        newmeter.save().catch(err => {
            res.status(400)
        });
        resolve(newmeter);
    });
}

function addEntry(meter, body, serialAddress) {
    return new Promise((resolve, reject) => {
        entryArray = new Array();
        if (body.record.length == undefined) {
            console.log('-------------------------- XML DATA --------------------------');
            console.log(`AcquiSuite: ${serialAddress.serial}\tAddress: ${serialAddress.devices.device.address}`);
            console.log(`Timestamp: ${pathShortener.record.time._}`);
            console.log(`point[0]: ${pathShortener.record.point[0].$.value}`);
            console.log('--------------------------------------------------------------');
            entry = new DataEntry();
            entry.meter_id = meter._id;
            entry.timestamp = body.record.time._;
            entry.building = meter.building;
            body.record.point.forEach((e, i) => {
                entry.point[i] = e.$;
                entry.point[i].value = Math.abs(entry.point[i].value);
            });
            entryArray.push(entry);
        } else {
            console.log('-------------------------- XML DATA --------------------------');
            console.log(`AcquiSuite: ${serialAddress.serial}\tAddress: ${serialAddress.devices.device.address}`);
            console.log(`Timestamp: ${pathShortener.record[0].time._}`);
            console.log(`point[0]: ${pathShortener.record[0].point[0].$.value}`);
            console.log('--------------------------------------------------------------');
            for (var i = 0; i < body.record.length; i++) {
                entry = new DataEntry();
                entry.meter_id = meter._id;
                entry.timestamp = body.record[i].time._;
                entry.building = meter.building;
                body.record[i].point.forEach((e, i) => {
                    entry.point[i] = e.$;
                    entry.point[i].value = Math.abs(entry.point[i].value);
                });
                entryArray.push(entry);
            }
        }
        entryArray.forEach(x => {
            DataEntry.findOne({
                timestamp: x.timestamp,
                meter_id: meter._id
            }, (err, doc) => {
                if (doc === null || doc === undefined) {
                    // save it to data entries
                    x.save().catch(err => {
                        res.status(400)
                    })
                    // add it to building
                    if (x.building) {
                        Building.findOneAndUpdate({
                                _id: entry.building
                            }, {
                                $push: {
                                    data_entries: x
                                }
                            },
                            (err) => {
                                if (err) throw (err)
                            });
                    }
                    console.log('Data entry id "' + x._id + '" with timestamp ' + x.timestamp + ' added to the meter named "' + meter.name + '" which is assigned to building id: "' + meter.building + '"');
                } else {
                    console.log('Duplicate detected and nothing has been added!');
                    console.log('Incoming Data\'s timestamp:\t' + x.timestamp + '  meter_id:\t' + x.meter_id);
                    console.log('Existing Data\'s timestamp:\t' + doc.timestamp + '  meter_id:\t' + doc.meter_id);
                }
            });
        });
        resolve()
    });
}

// launch ======================================================================
app.listen(6121); // 6121 is open on most PCs
console.log("Connected to AcquiSuite Receiver Server");