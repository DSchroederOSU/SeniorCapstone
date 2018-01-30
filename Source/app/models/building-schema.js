var mongoose = require('mongoose');
var buildingSchema = mongoose.Schema({
    name: String,
    serial: String,
    build_type: String,
    data_entry: [{
        entry: { type: mongoose.Schema.ObjectId, ref: 'DataEntry' },
       timestamp: { type: Date, required: true }
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Building', buildingSchema);