module.exports = function(app) {
    app.get('/', function (req, res) {

        res.render('index.html'); // load the index.html file
    });

    app.get('/dashboardNav', function (req, res) {

        res.render('dashboard-selector.html'); // load the index.html file
    });
}