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
    // XML POST PARSING ====================
    // =====================================
    // Function for handling xml post requests
    // Receives post requests, converts from XML to JSON
    // the 'xmlparser' in parameters converts XML to String
    // then bodyParser converts this string to JSON 
    app.post('/receiveXML', xmlparser({ trim: false, explicitArray: false }), function (req, res) {
    console.log(req.body.das.devices.device.records.record.point)

       
     pathShortener = req.body.das.devices.device.records.record;
  

      entry = new DataEntry();
   
      // Checks if meter exists. If it doesn't adds one.
      Meter.findOne({meter_id: req.body.das.serial},(err, doc1) => {
          if (doc1 === null || doc1 === undefined){
              console.log('Addmeter')
              newmeter = new Meter({
                name:   req.body.das.devices.device.name,
                meter_id:  req.body.das.serial,
                building: null
              });
              // issue, after meter is saved, data entry is lost because it gets added to null building.
              newmeter.save().catch( err => {res.status(400)});
              
          }
         setTimeout(()=>{ // 
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
          
            });
   
        },2000);
      res.send(req.body); // used for testing, below is required for acquisuites because they require that specifc return
    //   res.status("200");
    //   res.set({'content-type': 'text/xml', 'Connection': 'close'});
    //   res.send("<?xml version='1.0' encoding='UTF-8' ?>\n"
    //           +"<result>SUCCESS</result>\n"
    //           +"<DAS></DAS>"
    //           +"</xml>");
  });

    

// launch ======================================================================
app.listen(6121); // 6121 is open on most PCs
console.log("I think it's working!");
