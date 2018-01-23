angular.module('buildingController', [])
    .controller('buildingController', function($scope, GetBuildings) {
        GetBuildings.get()
            .success(function (data) {
                $scope.buildings = data;
            });

        $scope.getImage = function(building) {
            console.log(building.name.replace(/\s+/g, '-').toLowerCase());
            return "../assets/buildings/"+ building.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
        }
    });