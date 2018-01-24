var myApp = angular.module('myApp', ['ngRoute', 'mainController', 'blockController', 'buildingController',
    'BlockService', 'UserService', 'BuildingService']);
myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "../views/home.html"
    })

    ///////////////////////////
    ///////TOP NAV ITEMS///////
    ///////////////////////////
    .when("/about", {
        templateUrl : "../views/top-nav-views/about.html"
    })
    .when("/contact", {
        templateUrl : "../views/top-nav-views/contact.html"
    })

    ///////////////////////////
    ////////DASHBOARDS/////////
    ///////////////////////////
    .when("/dashboards", {
        templateUrl : "../views/dashboard/dashboards.html"
    })
    .when("/createdashboard", {
        templateUrl : "../views/dashboard/create-dashboard.html"
    })
    .when("/deletedashboard", {
        templateUrl : "../views/dashboard/delete-dashboard.html"
    })
    .when("/editdashboard", {
        templateUrl : "../views/dashboard/edit-dashboard.html"
    })

    ///////////////////////////
    //////////BLOCKS///////////
    ///////////////////////////
    .when("/editblock", {
        templateUrl : "../views/block/edit-block.html"
    })
    .when("/blocks", {
        templateUrl : "../views/block/blocks.html"
    })
    .when("/createblock", {
        templateUrl : "../views/block/create-block.html"
    })
    .when("/deleteblock", {
        templateUrl : "../views/block/delete-block.html"
    })

    ///////////////////////////
    /////////STORIES///////////
    ///////////////////////////


    ///////////////////////////
    ////////BUILDINGS//////////
    ///////////////////////////
    .when("/allBuildings", {
        templateUrl : "../views/building/buildings.html"
    })
    .when("/viewBuilding", {
        templateUrl : "../views/building/view-building.html"
    })


    ///////////////////////////
    ///////////MISC////////////
    ///////////////////////////

    .when("/addmeter", {
        templateUrl : "../views/meter-controls/add-meter-form.html"
    })
    .when("/meters", {
        templateUrl : "../views/meter-controls/meters.html"
    });
    //$locationProvider.html5Mode(true);   //this is what is breaking page reload
});