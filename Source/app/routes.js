require('mongoose');
var User = require('./models/user-schema');
var Building = require('./models/building-schema');
module.exports = function(app, passport) {

    app.get('/api/google_user', function(req, res) {
        if (req.user){
            res.json(req.user.google);
        }
        else{
            res.send(null)
        }

    });

    app.get('/api/buildings', function(req, res) {
        Building.find({}, function (err, buildings) {
            res.json(buildings); // return all buildings in JSON format
        });
    });

    app.get('/', function (req, res) {

        res.render('index.html'); // load the index.html file
    });

    app.get('/storyNav', function (req, res) {
        res.render('./story/story-selector.html'); // load the index.html file
    });

    app.get('/login', function (req, res) {
        res.render('login.html'); // load the index.html file
    });

    app.post('/api/addBlock', function(req, res) {
        console.log(req);
        var user = req.user;
        var new_block = {
                name        : req.body.name,
                building    : req.body.buildings,
                chart       : req.body.chart,
                variable    : "Killowatts/Hr"
            };
        user.block.push(new_block);
        user.save(function(err) {
            if (err)
                throw err;
            var result = user.block.filter(function( block ) {
                return block.name == new_block.name;
            });
            res.json(result);
        });
    });

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google',
        passport.authenticate('google', {
            scope : ['profile', 'email']
        })
    );

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/',
            failureRedirect : '/login'
        })
    );

    //=====================================
    // Data Collection
    //=====================================
    // Collects POST data from acquisuites,
    // converts it to JSON, and saves it to
    // the database.
    app.post('/acquisuite/upload/:id', function (req, res) {
      var postData = req.body;

      // TEMP - A file with post data will be created, and data will be dumped.
      fs.appendFile('./acquisuite-data/postData.txt',
      'New Acquisuite Data from '
      + req.params.id
      + ':\n'
      + postData,
      function(err) {
        if (err) throw err;
      });
    });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
