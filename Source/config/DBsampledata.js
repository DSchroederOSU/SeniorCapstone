var Building = require('../app/models/building-schema');

var academic_halls = ['Dryden Hall','Kelley Engineering Center', 'Milam Hall', 'Nash Hall', 'Weniger Hall'];
var res_halls = ['Bloss Hall', 'Buxton Hall', 'Callahan Hall', 'Cauthorn Hall', 'Finley Hall', 'Halsell Hall', 'Hawley Hall',
        'International Living Learning Center', 'McNary Hall', 'Poling Hall', 'Sackett Hall', 'Tebeau Hall',
        'Weatherford Hall', 'West Hall', 'Wilson Hall'];
var data_center = ['Marketplace West Dining Center', 'Milne Computing Center'];
var dining_facility = ['Arnold Dining Center'];
var library = ['Valley Library'];
var rec_center = ['Dixon Recreation Center'];
var other = ['CH2M Hill Alumni Center', 'Memorial Union', 'Student Experience Center'];

var count = 0;
for (res in res_halls){
    Building.findOne({ name : res_halls[count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var res = new Building();
            // set all of the relevant information
            res.name  = res_halls[count];
            res.building_type = 'Residence Hall/Dormitory';
            res.meter_id  = Math.floor(Math.random() * 20000)+10000;
            res.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            res.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            res.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            res.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            res.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + res.name + " added.");

            });
        }
        count++;

    });
}

var ac_count = 0;
for (ac in academic_halls){

    Building.findOne({ name : academic_halls[ac_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {

            // if the building is not in our database, create a new building
            var acBuilding = new Building();
            // set all of the relevant information
            acBuilding.name  = academic_halls[ac_count];
            acBuilding.building_type = 'Academic';
            acBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            acBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            acBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            acBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            acBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            acBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + acBuilding.name + " added.");

            });
        }
        ac_count++;
    });
}
var dc_count = 0;
for (dc in data_center){
    Building.findOne({ name : data_center[dc_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var dcBuilding = new Building();
            // set all of the relevant information
            dcBuilding.name  = data_center[dc_count];
            dcBuilding.building_type = 'Data Center';
            dcBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            dcBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dcBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dcBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dcBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            dcBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + dcBuilding.name + " added.");

            });
        }
        dc_count++;
    });
}

var din_count = 0;
for (din in dining_facility){
    Building.findOne({ name : dining_facility[din_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var dinBuilding = new Building();
            // set all of the relevant information
            dinBuilding.name  = dining_facility[din_count];
            dinBuilding.building_type = 'Dining Facility';
            dinBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            dinBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dinBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dinBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            dinBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            dinBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + dinBuilding.name + " added.");

            });
        }
        din_count++;
    });
}

var lib_count = 0;
for (lib in library){
    Building.findOne({ name : library[lib_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var libBuilding = new Building();
            // set all of the relevant information
            libBuilding.name  = library[lib_count];
            libBuilding.building_type = 'Library';
            libBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            libBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            libBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            libBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            libBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            libBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + libBuilding.name + " added.");

            });
        }
        lib_count++;
    });
}

var rec_count = 0;
for (rec in rec_center){
    Building.findOne({ name : rec_center[rec_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var recBuilding = new Building();
            // set all of the relevant information
            recBuilding.name  = rec_center[rec_count];
            recBuilding.building_type = 'Recreation Center';
            recBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            recBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            recBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            recBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            recBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            recBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + recBuilding.name + " added.");

            });
        }
        rec_count++;
    });
}

var o_count = 0;
for (o in other){
    Building.findOne({ name : other[o_count] }, function(err, building) {
        if (err)
            return done(err);
        if (building) {
            return null;
        } else {
            // if the building is not in our database, create a new building
            var oBuilding = new Building();
            // set all of the relevant information
            oBuilding.name  = other[o_count];
            oBuilding.building_type = 'Other';
            oBuilding.meter_id  = Math.floor(Math.random() * 20000)+10000;
            oBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            oBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            oBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            oBuilding.data_entry.push({date_time : new Date(), kw_hour : Math.floor(Math.random() * 4000)+1000});
            // save the building
            oBuilding.save(function(err) {
                if (err)
                    throw err;
                console.log("Document " + oBuilding.name + " added.");

            });
        }
        o_count++;
    });
}