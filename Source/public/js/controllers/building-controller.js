angular.module('buildingController', [])
    .controller('buildingController', function($scope, GetBuildings) {
        GetBuildings.get()
            .success(function (data) {
                $scope.buildings = data;
            });

        $scope.getImageAddress = function(building) {
            return "../assets/buildings/"+ building.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
        }
    });