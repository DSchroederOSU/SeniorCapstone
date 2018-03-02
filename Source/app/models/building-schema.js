var mongoose = require('mongoose');
var buildingSchema = mongoose.Schema({
    name: String,
    building_type: String,
    meters: [{
        name:   String,
        meter_id:   String
        }],
    data_entries: [{
        meter_id:   {type:mongoose.Schema.ObjectId, ref: 'Meter'},
        timestamp: { type: String, required: true },
        point: [{
            number: Number,
            name: String,
            units: String,
            value: Number
        }]
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Building', buildingSchema);