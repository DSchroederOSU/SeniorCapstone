var selectedBuildings = [];
var dropdownBuildings = [];
angular.module('blockController', [])
    .controller('blockController', function($scope, GetBuildings) {

        GetBuildings.get()
            .success(function (data) {
                dropdownBuildings = data;
                $scope.buildings = dropdownBuildings;
            });

        $scope.selection = function(building) {
            selectedBuildings.push(building);
            var index = dropdownBuildings.indexOf(building);
            if (index > -1) {
                dropdownBuildings.splice(index, 1);
            }
            $scope.buildings = dropdownBuildings;
            $scope.selectedBuildings = selectedBuildings;
            $scope.buildingSelection = "";
            console.log(selectedBuildings);
        };

        $scope.removeBuilding = function(building) {
            dropdownBuildings.push(building);
            var index = selectedBuildings.indexOf(building);
            if (index > -1) {
                selectedBuildings.splice(index, 1);
            }
            $scope.buildings = dropdownBuildings;
            $scope.selectedBuildings = selectedBuildings;
            $scope.buildingSelection = "";
        };
    });