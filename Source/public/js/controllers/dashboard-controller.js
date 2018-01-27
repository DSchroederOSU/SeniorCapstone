angular.module('dashboardController', [])
    .controller('dashboardController', function($scope, GetDashboards) {

        GetDashboards.get()
            .success(function (data) {
                $scope.dashboards = data;
            });

    });