// dataServer.js
// This is a seperate server that's dedicated to accepting data from acquisuites
// in real time.

// set up ======================================================================
// get all the tools we need
var dotenv   = require('dotenv').config();
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var Building = require('./app/models/building-schema');
var Meter = require('./app/models/meter-schema');
var DataEntry = require('./app/models/data-entry-schema');
var fs       = require('fs'); // TEMP - for saving acquisuite POST data\
var bodyParser   = require('body-parser');
var morgan       = require('morgan');
var xmlparser = require('express-xml-bodyparser');

// configuration ===============================================================

mongoose.connect(process.env.MONGO_DATABASE_URL, { useMongoClient: true }); // connect to our database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("We're connected");
});

// log every request to the console
app.use(morgan('dev'));

// Parse post bodies
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());// get information from html forms

// Obtain DB schema
// Routes ======================================================================

//=====================================
// Data Collection
//=====================================
// Collects POST data from acquisuites,
// converts it to JSON, and saves it to
// the database.
app.post('/acquisuite/upload/:id', function (req, res) {

  console.log(req.body);

  // TEMP - A file with post data will be created, and data will be dumped.
  fs.appendFile('./acquisuite-data/postData.txt',
  'New Acquisuite Data from '
  + req.params.id
  + ':\n'
  + req.body
  + '\n',
  function(err) {
    if (err) throw err;
  });

  res.status("200");
  res.set({'content-type': 'text/xml', 'Connection': 'close'});
  res.send("<?xml version='1.0' encoding='UTF-8' ?>\n"
          +"<result>SUCCESS</result>\n"
          +"<DAS></DAS>"
          +"</xml>");
});

    // =====================================
    // XML POST PARSING 
    // =====================================
    // Function for handling xml post requests
    // Receives post requests, converts from XML to JSON
    // the 'xmlparser' in parameters converts XML to String
    // then bodyParser converts this string to JSON 
    app.post('/receiveXML', xmlparser({ trim: false, explicitArray: false }), function (req, res) {   
        if (req.body.das.mode == 'LOGFILEUPLOAD'){
            pathShortener = req.body.das.devices.device.records
         // Checks if meter exists. If it doesn't adds one.
            Meter.findOne({meter_id: req.body.das.serial},(err, doc) => {
                if (doc === null || doc === undefined){
                       addMeter(req.body.das).then(data => addEntry(data, pathShortener));
                } else{
                     addEntry(doc, pathShortener);                 
                }   
            });  
        }
        else{
            console.log('STATUS file received');
        }
       
        res.status("200");
        res.set({'content-type': 'text/xml', 'Connection': 'close'});
        res.send("<?xml version='1.0' encoding='UTF-8' ?>\n"
                +"<result>SUCCESS</result>\n"
                +"<DAS></DAS>"
                +"</xml>");
  });

function addMeter(meter) {
    return new Promise((resolve, reject) => {
        newmeter = new Meter({
            name:   meter.devices.device.name,
            meter_id:  meter.serial,
            building: null
        });
        console.log('New meter "' + newmeter.name + '" has been added.')
        newmeter.save().catch( err => {res.status(400)})
        resolve(newmeter);
    });
}

function addEntry(meter,body){
    return new Promise((resolve, reject) => {
        
        entryArray = new Array();
        if (body.record.length == undefined){
            entry = new DataEntry();
            entry.meter_id = meter._id;
            entry.timestamp = body.record.time._;
            entry.building = meter.building
            body.record.point.forEach((e,i) => {entry.point[i] = e.$;});
            entryArray.push(entry);
        }
        else{
            for (var i = 0; i < body.record.length; i++){
                entry = new DataEntry();
                entry.meter_id = meter._id;
                entry.timestamp = body.record[i].time._;
                entry.building = meter.building
                body.record[i].point.forEach((e,i) => {entry.point[i] = e.$;});
                entryArray.push(entry);
            }
        }

    entryArray.forEach(x => {
       
        DataEntry.findOne({timestamp: x.timestamp, meter_id: meter._id}, (err,doc2) => {
            if (doc2 === null || doc2 === undefined){
            
                // save it to data entries
                x.save().catch( err => {res.status(400)})
                // add it to building
                if (x.building !== null){
                    Building.findOneAndUpdate({_id: entry.building},
                        {$push:{data_entries: x}},
                        {safe: true, upsert: true, new: true},
                        (err) =>{if (err) throw(err)})
                }
                console.log('Data entry id "' +  x._id + '" added to the meter named "' + meter.name + '" which is assigned to building id: "'+ meter.building+ '"')
            } else{
                console.log('Duplicate detected and nothing has been added!')
            }
        });
    });
resolve()
});


}

// launch ======================================================================
app.listen(6121); // 6121 is open on most PCs
console.log("I think it's working!");
