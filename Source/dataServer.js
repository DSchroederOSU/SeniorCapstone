/**
 * @file Contains the functions for data collection server backend
 * @author Aubrey Thenell, Daniel Schroede, Parker Bruni.
 * @module DataServer 
 */


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

// configuration
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

// globals to check against email alert status
var emailFlag = false;
var dataFlag = false;



/**
 * Handles POST requests received in XML format
 * Receives POST requests, converts from XML to JSON
 * @name post->receiveXML
 * @memberof module:DataServer
 * @function
 * @inner
 * @param {string} path - Express path
 * @param {Object} xml  - Contains the XML data coming in.
 * @fires checkUsage
 * @fires checkMeterTimestamps
 * @fires addMeter
 * @fires addEntry
 * @returns {Promise}
 */
app.post('/receiveXML', xmlparser({
    trim: false,
    explicitArray: false
}), function (req, res) {
    if (req.body.das.mode === 'LOGFILEUPLOAD') {
        timestamp = moment().utc().format('HH:mm:ss');
        console.log('Received XML data on: ' + moment.utc().format('YYYY-MM-DD HH:mm:ss'));

        // calls email helper func once per day.
        if (emailFlag && timestamp > '00:00:00' && timestamp < '00:20:00') {
            console.log('Meters being reviewed for outage.')
            emailFlag = false;
            dataFlag = false;
            checkUsage();
            checkMeterTimestamps();
        } else if (!emailFlag && timestamp > '12:00:00' && timestamp < '12:15:00') {
            console.log('Email flag being reset');
            emailFlag = true;
            dataFlag = true;
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

/**
 * Sends out alert to users (admins).
 * Specifically when A meter hasn't checked in over a day. 
 * Also when a meter reports unusually high usage.
 * @param {Object} email          - Contains email contents to be sent.
 * @param {String} email.subject  - Contains the email's subject.
 * @param {String} email.body     - Contains the email's body.
 * @return {void}
 */
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

/**
 *  Helper function to see when the last time a meter posted
 *  Called once per day and Sends email if meter hasn't checked in for over a day but under two
 * @fires emailAlert
 * @return {void}
 */

function checkMeterTimestamps() {
    var yesterday = moment.utc().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var twoDaysAgo = moment.utc().subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss');
    var meterCount = 0;
    var email = {
        body: '',
        subject: 'Meter(s) detected as offline!'
    }
    Meter.find().then(meters => {
        if (meters) {
            // finds data entries for each meter and checks the last data entries time.
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
        }
    })
}

/**
 * Function used to find and alert during high usage spikes
 * Conditions - Only sends email if Average for day is greater than the average for week plus a standard deviation and
 * the meter has more than 100 entries 
 * @fires emailAlert
 */
function checkUsage() {
    var now = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    var yesterday = moment.utc().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss');
    var oneWeekAgo = moment.utc().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
    var meterCount = 0;
    var email = {
        body: '',
        subject: 'High Energy Usage Detected!'
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
                if (err) throw (err);
                // We want the length to be greater than 100 in the past week (96 are entered per day)
                // Without this, a meter might report some weird things, so this forces at least two days of entries
                if (docs.length && docs.length >= 100) {
                    pastData = docs.filter(t => {
                        return t.timestamp >= oneWeekAgo && t.timestamp <= yesterday
                    });

                    currentData = docs.filter(t => {
                        return t.timestamp >= yesterday && t.timestamp <= now
                    });

                    if (pastData.length) {
                        pastDataArray = [];
                        // gets the energy usage values for the past week
                        for (i = 0; i < pastData.length; i++) {
                            pastDataArray.push(pastData[i].point[0].value);
                        }
                        pastDataAvg = math.mean(pastDataArray);
                        pastDataSD = math.std(pastDataArray);
                        pastDataThreshhold = pastDataAvg + pastDataSD;
                        // checks for empty array so it doesn't report on down meter
                        if (currentData.length) {
                            currentDataArray = [];
                            for (i = 0; i < currentData.length; i++) {
                                currentDataArray.push(currentData[i].point[0].value);
                            }
                            currentDataAvg = math.mean(currentDataArray);
                            if (currentDataAvg > pastDataThreshhold) {
                                email.body += (`The meter named <b>"${e.name}"</b> with a serial of <b>"${e.meter_id}"</b> has reported high energy usage.` +
                                    ` Over the past week, the meter had an average of <b>${pastDataAvg.toFixed(1)}</b> kWh,` +
                                    ` but has reported <b style="color:red">${currentDataAvg.toFixed(1)}</b> kWh in the past 24 hours. <br>`)
                            }
                        }
                    }
                    if (meterCount++ == meters.length - 1 && email.body !== '') {
                        emailAlert(email);
                    }
                }
            });
        });
    });
}

/**
 * Function that is called when the server gets a POST request from a meter
 * that is not in our database already.
 * Only called when a matching meter cannot be located in the database
 * @param {Object} meter - Contains a POST request body that is slightly trimmed
 * @returns {Promise<Meter>} newmeter
 */
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

/**
 * Function to add a data entry to a database. Checks for duplicate first.
 * Conditions:
 *      - Called whenever POST request comes in
 * @param   {Object} meter            - Contains elements of the source meter
 * @param   {String} meter._id        - Contains the ID of the meter as it is in the database
 * @param   {String} meter.name       - Contains the public facing name of the meter as it is in the database
 * @param   {String} meter.building   - Contains the building that the meter is associated with as it is in the database
 * @param   {Object} body             - Contains the POST request body with all extraneous pieces cut
 * @param   {Object} serialAddress    - Contains the POST request body that can access the serial and address information
 * @returns {Promise}
 */
function addEntry(meter, body, serialAddress) {
    console.log(body);
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
                    if (x.building != null && x.building != 'null') {
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