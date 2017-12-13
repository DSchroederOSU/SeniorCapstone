
angular.module('mainController', [])
    .controller('mainController', function($scope) {
        $scope.showDashboards = function () {

        }

    })
    .directive('sideNav', function() {
        return {
            restrict: 'E',
            scope: {model:'='},
            templateUrl: '../../views/side-navigation.html'
        };
    });

