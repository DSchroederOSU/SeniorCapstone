var selectedBuilding;

angular.module('buildingController', [])
    .controller('buildingController', function($scope, GetBuildings) {
        $scope.buildingModel = selectedBuilding;

        GetBuildings.get()
            .success(function (data) {
                $scope.buildings = data;
            });
        $scope.getImageAddress = function(building) {
            if (building){
                return "../assets/buildings/"+ building.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            }
            else{
                return "../assets/buildings/"+ selectedBuilding.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            }
        };
        $scope.viewBuilding = function(building) {
            selectedBuilding = building;
            $scope.BuildingName = building.name;
            $scope.currentBuilding = selectedBuilding;

        };
        $scope.formatDate = function(date){
            return "" + date.substring(0,10) + " " + date.substring(14,19).replace(/^0+/, '')
        };

        $scope.getDataDay = function(date){
            console.log(date.substring(9,10));
            return parseInt(date.substring(9,10))
        }
    });