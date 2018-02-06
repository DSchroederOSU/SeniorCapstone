var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var Building = require('../app/models/building-schema');
var DataEntry = require('../app/models/data-entry-schema');
var mongojs = require('mongojs');
var db = mongojs('buildings');

var exports = module.exports = {};
var mongoose = require("mongoose");
mongoose.createConnection("mongodb://localhost:27017/");

exports.addBuildingToDatabase = (entry) => {
    console.log(entry.building.name);
    console.log(entry.building.serial);
    
    // If entry exists in DB already, using serial as match, return from function
    /*db.collection('buildingsqwerw', (err,collection) => {
        if (err){
            throw err;
        } else {
            console.log("no error");
            collection.find();
        }
    })*/
    //db.buildings.find();
    var test = new Building();
//    db.buildings.findOne({
//     name:   mongojs.toString('Valley Lib')
// }, function(err, doc) {
//    console.log(doc);
  
// });
    db.building.find(function (err, docs) {
        console.log(docs)
    })
    // if the building is not in our database, create a new building
    var build = new Building();
    // set all of the relevant information
    build.name = entry.building.name
    build.building_type = entry.building.building_type;
    // serial can be used as identifier when adding data (data has serial # of AcquiSuite)
    build.serial = entry.building.serial;
    // save the building
    build.save()
        .catch( err => {res.status(400).send("unable to save to database");})
       
    console.log("The building '" + entry.building.name + "' has been added.");
    
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
  





/*
var count = 0;
for (res in res_halls) {
    Building.findOne({ name: res_halls[count] }, function (err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var res = new Building();
            // set all of the relevant information
            res.name = res_halls[count];
            res.building_type = 'Residence Hall/Dormitory';
            res.meter_id = Math.floor(Math.random() * 20000) + 10000;
            res.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            res.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            res.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            res.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            // save the building
            res.save(function (err) {
                if (err)
                    throw err;
                console.log("Document " + res.name + " added.");

            });
        }
        count++;

    });
}

var ac_count = 0;
for (ac in academic_halls) {

    Building.findOne({ name: academic_halls[ac_count] }, function (err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {

            // if the building is not in our database, create a new building
            var acBuilding = new Building();
            // set all of the relevant information
            acBuilding.name = academic_halls[ac_count];
            acBuilding.building_type = 'Academic';
            acBuilding.meter_id = Math.floor(Math.random() * 20000) + 10000;
            acBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            acBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            acBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            acBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            // save the building
            acBuilding.save(function (err) {
                if (err)
                    throw err;
                console.log("Document " + acBuilding.name + " added.");

            });
        }
        ac_count++;
    });
}
var dc_count = 0;
for (dc in data_center) {
    Building.findOne({ name: data_center[dc_count] }, function (err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var dcBuilding = new Building();
            // set all of the relevant information
            dcBuilding.name = data_center[dc_count];
            dcBuilding.building_type = 'Data Center';
            dcBuilding.meter_id = Math.floor(Math.random() * 20000) + 10000;
            dcBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dcBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dcBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dcBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            // save the building
            dcBuilding.save(function (err) {
                if (err)
                    throw err;
                console.log("Document " + dcBuilding.name + " added.");

            });
        }
        dc_count++;
    });
}

var din_count = 0;
for (din in dining_facility) {
    Building.findOne({ name: dining_facility[din_count] }, function (err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var dinBuilding = new Building();
            // set all of the relevant information
            dinBuilding.name = dining_facility[din_count];
            dinBuilding.building_type = 'Dining Facility';
            dinBuilding.meter_id = Math.floor(Math.random() * 20000) + 10000;
            dinBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dinBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dinBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            dinBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
            // save the building
            dinBuilding.save(function (err) {
                if (err)
                    throw err;
                console.log("Document " + dinBuilding.name + " added.");

            });
        }
        din_count++;
    });
}

    
    var rec_count = 0;
    for (rec in rec_center) {
        Building.findOne({ name: rec_center[rec_count] }, function (err, building) {
            if (err)
                return done(err);
            if (building) {
                return null;
            } else {
                // if the building is not in our database, create a new building
                var recBuilding = new Building();
                // set all of the relevant information
                recBuilding.name = rec_center[rec_count];
                recBuilding.building_type = 'Recreation Center';
                recBuilding.meter_id = Math.floor(Math.random() * 20000) + 10000;
                recBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                recBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                recBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                recBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                // save the building
                recBuilding.save(function (err) {
                    if (err)
                        throw err;
                    console.log("Document " + recBuilding.name + " added.");

                });
            }
            rec_count++;
        });
    }

    var o_count = 0;
    for (o in other) {
        Building.findOne({ name: other[o_count] }, function (err, building) {
            if (err)
                return done(err);
            if (building) {
                return null;
            } else {
                // if the building is not in our database, create a new building
                var oBuilding = new Building();
                // set all of the relevant information
                oBuilding.name = other[o_count];
                oBuilding.building_type = 'Other';
                oBuilding.meter_id = Math.floor(Math.random() * 20000) + 10000;
                oBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                oBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                oBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                oBuilding.data_entry.push({ date_time: new Date(), kw_hour: Math.floor(Math.random() * 4000) + 1000 });
                // save the building
                oBuilding.save(function (err) {
                    if (err)
                        throw err;
                    console.log("Document " + oBuilding.name + " added.");

                });
            }
            o_count++;
        });
    */