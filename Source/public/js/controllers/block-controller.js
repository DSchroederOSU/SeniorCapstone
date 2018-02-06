var selectedBuildings = [];
var dropdownBuildings = [];
angular.module('blockController', [])
    .controller('blockController', function($scope, GetBuildings, AddBlock, GetUserBlocks) {

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

        $scope.CreateBlock = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm) && !$.isEmptyObject($scope.chartForm))  {
                // call the create function from our service (returns a promise object)
                var BlockData = {
                    "name": $scope.nameForm,
                    "chart": $scope.chartForm,
                    "buildings": selectedBuildings
                };
                AddBlock.create(BlockData)
                // if successful creation
                    .success(function(data) {
                        $scope.nameForm = "";
                        $scope.chartForm = "";
                    });
            }
        };
        GetUserBlocks.get()
            .success(function(data) {
                $scope.userBlocks = data;
            });
    });