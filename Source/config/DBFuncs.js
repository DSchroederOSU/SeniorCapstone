var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var Building = require('../app/models/building-schema');
var DataEntry = require('../app/models/data-entry-schema');
var mongoose = require("mongoose");
mongoose.createConnection("mongodb://localhost:27017/");
var exports = module.exports = {};

exports.addBuildingToDatabase = (entry) => {
  Building.findOne({name: entry.building.name}, function (err, docs) {
        if(docs === null){ // ensure building doesn't exist
            var build = new Building();
             // set all of the relevant information
            build.name = entry.building.name
            build.building_type = entry.building.building_type;
            // serial can be used as identifier when adding data (data has serial # of AcquiSuite)
            build.serial = entry.building.serial;
            // save the building
            build.save()
                 .catch( err => {res.status(400)
                 .send("unable to save to database");})
            console.log("The building '" + entry.building.name + "' has been added.");
        }
        else
            console.log('Nothing was added');     
      });
};

  

exports.addEntryToDatabase = (entry) => {
    /*
    var data = new DataEntry();
    data.point = entry.das.devices.device.records.record.point;
    data.timestamp = entry.das.devices.device.records.record.time._;
    res 
    */
};  
    
   // var test = Building.count({ name: entry.das.devices.device.name });
    // console.log(test);
  



