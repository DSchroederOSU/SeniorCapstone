
angular.module('mainController', [])
    .controller('mainController', function($scope, UserName) {

        UserName.get()
        .success(function(data) {
            $scope.google_user = data;
            $scope.firstname = data.name.split(' ')[0];
        });

        $scope.dashboardClass = 'hideDash';
        $scope.showDashboards = function () {
            console.log("REACHED");
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

