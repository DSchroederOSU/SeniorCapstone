angular.module('buildingController', [])
    .controller('buildingController', function($scope, GetBuildings) {
        GetBuildings.get()
            .success(function (data) {
                $scope.buildings = data;
            });

        $scope.getImage = function(building) {
            return "arnold-dining-center.jpg";
        }
    });