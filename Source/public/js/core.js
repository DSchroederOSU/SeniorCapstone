var myApp = angular.module('myApp', ["ngRoute", 'mainController']);
myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            templateUrl : "../views/home.html"
        })
        .when("/dashboards", {
            templateUrl : "../views/dashboards.html"
        })
        .when("/editblock", {
            templateUrl : "../views/block/edit-block.html"
        })
        .when("/deleteblock", {
            templateUrl : "../views/block/delete-block.html"
        })
        .when("/blocks", {
            templateUrl : "../views/blocks.html"
        })
        .when("/createBlock", {
            templateUrl : "../views/create-block.html"
        })
        .when("/viewBlocks", {
            templateUrl : "../views/view-blocks.html"
        });
    //$locationProvider.html5Mode(true);   //this is what is breaking page reload
});