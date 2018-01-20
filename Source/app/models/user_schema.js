var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    block            : [{
        building     : [{
            name     : String,
            meter_id : Number,
            type     : String
        }],
        chart        : String,
        variable     : String
    }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);