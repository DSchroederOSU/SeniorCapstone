var selectedBuildings = [];
var dropdownBuildings = [];
var title = "";
var buttontext = "";

//needs a function that goes through each block in User.blocks and retrieves chart data from that object.
var blocksChartData = [];

angular.module('blockController', [])
    .controller('blockController', function($route, $scope, $location, $timeout, Building, Block, GetBlockByID) {
        $scope.title = title;
        $scope.button_text = buttontext;
        $scope.buildings = [];
        selectedBuildings = [];
        if(title == "Create Block"){
            Building.get()
                .success(function (data) {
                    dropdownBuildings = data;
                    $scope.buildings = dropdownBuildings;
                    $scope.selectedBuildings = "";
                });
        }
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


        Block.get()
            .success(function(data) {
                $scope.userBlocks = data;
            });

        $scope.DeleteBlock = function(block){
            Block.delete(block)
                .success(function() {
                    $route.reload();
                });
        };
        $scope.create = function(){
            title = "Create Block";
            buttontext = "Create";
        };

        $scope.EditBlock = function(block){
            title = "Update Block";
            buttontext = "Update";

            GetBlockByID.get(block)
                .success(function(block) {
                    $scope.nameForm = block.name;
                    for(b in block.building){
                        //var index = $scope.buildings.findIndex(x => x._id === block.building[b]._id);
                        console.log(index);
                        if (index > -1) {
                            $scope.buildings.splice(index, 1);
                            selectedBuildings.push(block.building[b]);
                        }
                    }
                    //$scope.buildings = dropdownBuildings;
                    $scope.selectedBuildings = selectedBuildings;
                    $scope.buildingSelection = "";
                    console.log($scope.buildings);
                    console.log(dropdownBuildings);
                    console.log(selectedBuildings);

                });
            $location.path('/createblock');
        };

        $scope.submit = function(){
            if(buttontext == "Update"){
                console.log("WE ARE UPDATING");
            }
            else{
                CreateBlock();
            }
        };


        function CreateBlock() {
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
                Block.create(BlockData)
                // if successful creation
                    .success(function(data) {
                        selectedBuildings.forEach(function(b) {
                            dropdownBuildings.push(b);
                        });
                        selectedBuildings = [];
                        $scope.selectedBuildings = selectedBuildings;
                        $scope.nameForm = "";
                        $scope.chartForm = "";
                        $location.path('/blocks');

                    });
            }
        };
		
		
		
		
	});