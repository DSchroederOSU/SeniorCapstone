var myApp = angular.module('myApp', ['dashboardController', 'mainController', 'blockController',
    'buildingController', 'mapController', 'meterController', 'storyController', 'chartController', 
    'BlockService', 'UserService', 'MeterService','BuildingService',
    'DashboardService', 'StoryService', 'ngRoute']);

myApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
	///////////////////////////
    ///////HOME PAGE///////
    ///////////////////////////
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
    .when("/viewdashboard", {
        templateUrl : "../views/dashboard/view-dashboard.html"
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
    .when("/createStory", {
        templateUrl : "../views/story/create-story.html"
    })
    .when("/viewStory", {
        templateUrl : "../views/story/view-story.html"
    })
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
    ///////////METERS////////////
    ///////////////////////////
    .when("/addBuilding", {
        templateUrl : "../views/building/create-building.html"
    })

    .when("/editmeter/:id", {
        templateUrl : "../views/meter-controls/add-meter-form.html",
        controller : "meterEditController",
        reloadOnSearch: false,
        resolve: {
            editmeter: function (Meter, $route) {
                return Meter.getById($route.current.params.id);
            }
        }
    })
    .when("/addmeter", {
        templateUrl : "../views/meter-controls/add-meter-form.html",
        controller : "meterController"
    })
    .when("/meters", {
        templateUrl : "../views/meter-controls/meters.html",
        controller : "meterController"
    });
    //$locationProvider.html5Mode(true);   //this is what is breaking page reload
});

myApp.controller('meterEditController', function($scope, $location, $route, Meter, Building, editmeter) {

    $scope.meterFormTitle = "Update Meter";
    $scope.buttonText = "Update";
    $scope.meterNameForm = editmeter.name;
    $scope.meterSerialForm =  editmeter.meter_id;

    $scope.submit = function() {
        if (!$.isEmptyObject($scope.meterNameForm) && !$.isEmptyObject($scope.meterSerialForm))  {
            // call the create function from our service (returns a promise object)
            var meterData = {
                "name": $scope.meterNameForm,
                "meter_id": $scope.meterSerialForm,
                "id"    :   editmeter._id
            };

            Meter.update(meterData)
            // if successful creation
                .success(function(meter) {
                    $scope.nameForm = "";
                    $scope.serialForm = "";
                    $location.path('/meters');
                });
        }

    }
});