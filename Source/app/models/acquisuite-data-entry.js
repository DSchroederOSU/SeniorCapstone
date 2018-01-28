var mongoose = require('mongoose');
var acquisuiteDataSchema = mongoose.Schema({
    Total_Net_Instantaneous : {
            real_power            : String,
            reactive_power        : String,
            apparant_power        : String
    },
    block            : [{
        name         : String,
        building     : [{type:mongoose.Schema.ObjectId, ref: 'Building'}],
        chart        : String,
        variable     : String
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('DataEntry', acquisuiteDataSchema);