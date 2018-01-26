module.exports = {
    url : 'mongodb://localhost/local'
};

// configuration ===============================================================

mongoose.connect(configDB.url, { useMongoClient: true }); // connect to our database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("We're connected");
});
