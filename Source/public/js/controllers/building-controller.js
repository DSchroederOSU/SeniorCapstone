angular.module('buildingController', [])
    .controller('buildingController', function($scope, GetBuildings) {
        GetBuildings.get()
            .success(function (data) {
                $scope.buildings = data;
            });
    });