var mongoose = require('mongoose');
var buildingSchema = mongoose.Schema({
    name: String,
    building_type: String,
    meter_id: String,
    data_entry: [{
        entry:      { type: mongoose.Schema.ObjectId, ref: 'DataEntry' },
        timestamp: { type: Date }
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Building', buildingSchema);