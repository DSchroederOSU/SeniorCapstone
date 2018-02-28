
angular.module('mainController', [])
    .controller('mainController', function($scope, GetUser, Story) {

        Story.get()
            .success(function(user_stories){
                $scope.stories = user_stories;
            });

        GetUser.get()
        .success(function(data) {
            if (data) {
                $scope.login_status = "Logout";
                $scope.greeting = "Hello " + data.name.split(' ')[0] + "!";
            }
            else{
                $scope.login_status = "Login";
                $scope.greeting = "";
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

