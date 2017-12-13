var myApp = angular.module('myApp', ["ngRoute", 'mainController']);
myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            templateUrl : "../views/home.html"
        })
        .when("/createBlock", {
            templateUrl : "../views/create-block.html"
        })
        .when("/viewBlocks", {
            templateUrl : "../views/view-blocks.html"
        });
    $locationProvider.html5Mode(true);
});