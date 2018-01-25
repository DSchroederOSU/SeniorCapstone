var mongoose = require('mongoose');
var blockSchema = mongoose.Schema({
    name            : String,
    building_type   : String,
    meter_id        : Number,

    data_entry      : [{
        date_time   : {type: Date, required: true},
        kw_hour     : {type: Number, required: true}
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Block', blockSchema);