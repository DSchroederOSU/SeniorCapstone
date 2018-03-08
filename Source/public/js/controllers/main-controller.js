
angular.module('mainController', [])
    .controller('mainController', function($scope, $rootScope, GetUser, Story) {


        Story.get()
            .success(function(user_stories){
                $scope.stories = user_stories;
            });

        GetUser.get()
        .success(function(data) {
            if (data) {
                $scope.login_status = "Logout";
                $scope.greeting = "Hello " + data.name.split(' ')[0] + "!";
                $scope.myLink = "logout";
                $scope.userLoggedIn = false;
                $scope.mainContent = 'shiftRight';

            }
            else{
                $scope.login_status = "Login";
                $scope.greeting = "";
                $scope.myLink = "auth/google";
                $scope.userLoggedIn = true;
                $scope.mainContent = 'shiftLeft';
            }
        });

        $scope.dashboardClass = 'hideDash';
        $scope.showDashboards = function () {
            $scope.dashboardClass = 'showDash';
        }

    })


    .directive('sideNav', function() {
        return {
            restrict: 'E',
            scope: {model:'='},
            templateUrl: '../../views/side-navigation.html'
        };
    })
    .directive('topNav', function() {
        return {
            restrict: 'E',
            scope: {model:'='},
            templateUrl: '../../views/top-navigation.html'
        };
    });

