var myApp = angular.module('myApp', ['ngRoute', 'mainController', 'blockController', 'UserService', 'BuildingService']);
myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "../views/home.html"
    })
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
    });
    //$locationProvider.html5Mode(true);   //this is what is breaking page reload
});