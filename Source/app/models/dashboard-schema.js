var mongoose = require('mongoose');
var dashboardSchema = mongoose.Schema({
    name: String,
    description: String,
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    blocks: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Block'
    }]
});
// create the model for dashboards and expose it to our app
module.exports = mongoose.model('Dashboard', dashboardSchema);