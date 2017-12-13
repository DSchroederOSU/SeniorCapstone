
angular.module('mainController', [])
    .controller('mainController', function($scope) {

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

