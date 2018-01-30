var Building = require('../app/models/building-schema');
var DataEntry = require('../app/models/data-entry-schema');


    
// if the building is not in our database, create a new building
var libBuilding = new Building();
libBuilding.data_entry = new DataEntry();
// set all of the relevant information
libBuilding.name = 'Valley Library';
libBuilding.building_type = 'Library';
libBuilding.serial = json.a;
libBuilding.data_entry.serial = libBuilding.serial;
// save the building
libBuilding.save(function(err) {
    if (err)
        throw err;
    console.log("Document " + libBuilding.name + " added.");

});
        
lib_count++;
 
