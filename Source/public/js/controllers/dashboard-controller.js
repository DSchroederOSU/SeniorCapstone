angular.module('dashboardController', [])
    .controller('dashboardController', function($scope, GetDashboards, GetUserBlocks) {

        GetDashboards.get()
            .success(function (data) {
                $scope.dashboards = data;

            });
        GetUserBlocks.get()
            .success(function(data) {
                $scope.userBlocks = data;
            });


    });