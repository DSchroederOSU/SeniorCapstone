var mongoose = require('mongoose');
var dataEntrySchema = mongoose.Schema({
    meter_serial: String,

   
        entry: [{
            point: [{
                number: Number,
                name: String,
                units: String,
                value: Number
            }],
            timestamp: { type: Date, required: true }
        }]
       

   
});

// create the model for users and expose it to our app
module.exports = mongoose.model('DataEntry', dataEntrySchema);