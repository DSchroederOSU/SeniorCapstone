var mongoose = require('mongoose');
var dataEntrySchema = mongoose.Schema({
    meter_serial: String,
    timestamp: { type: Date, required: true },
    point: [{
        number: Number,
        name: String,
        units: String,
        value: Number
    }]
   
});

// create the model for users and expose it to our app
module.exports = mongoose.model('DataEntry', dataEntrySchema);