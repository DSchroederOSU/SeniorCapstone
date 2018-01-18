var User = require('./models/user');
module.exports = function(app, passport) {
    app.get('/', function (req, res) {
        res.render('index.html'); // load the index.html file
    });

    app.get('/dashboardNav', function (req, res) {

        res.render('dashboard-selector.html'); // load the index.html file
    });
    app.get('/login', function (req, res) {

        res.render('login.html'); // load the index.html file
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
            failureRedirect : '/login-error'
        })
    );

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
