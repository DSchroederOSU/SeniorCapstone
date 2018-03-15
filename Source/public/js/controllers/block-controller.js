var selectedBuildings = [];
var dropdownBuildings = [];
var editBlock = null;

//needs a function that goes through each block in User.blocks and retrieves chart data from that object.
var blocksChartData = [];

angular.module('blockController', [])
    .controller('blockController', function($route, $scope, $http, $location, $timeout, Building, Block, GetBlockByID) {
        selectedBuildings = [];
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

        $scope.getTitle = function(){
            if(editBlock == null){
                $scope.title = "Create Block";
                $scope.buttontext = "Create";
            }
            else{
                $scope.title = "Update Block";
                $scope.buttontext = "Update";
            }
        };

        $scope.create = function(){
            editBlock = null;
        };

        $scope.getName = function(){
            if(editBlock != null){
                $scope.nameForm = editBlock.name;
            }
        };
        $scope.getChart = function(){
            if(editBlock != null){
                $scope.chartForm = editBlock.chart;
            }
        };

        $scope.getBlockBuildings = function(){
            if(editBlock != null){
                GetBlockByID.get(editBlock)
                    .then(function(block) {
                        Building.get()
                            .then(function (data) {
                                dropdownBuildings = data.data;
                                $scope.selectedBuildings = "";
                                block.data.building.forEach( function(building){
                                    var count = 0;
                                    dropdownBuildings.forEach(function (obj) {
                                        if(obj._id == building._id){
                                            dropdownBuildings.splice(count, 1);
                                            selectedBuildings.push(obj);
                                            count++;
                                        }
                                        else count++;
                                    });
                                });
                                $scope.buildings = dropdownBuildings;
                                $scope.selectedBuildings = selectedBuildings;
                                $scope.buildingSelection = "";
                            });


                    });
            }
            else{
                Building.get()
                    .then(function (data) {
                        console.log(data.data);
                        dropdownBuildings = data.data;
                        $scope.buildings = dropdownBuildings;
                        $scope.selectedBuildings = "";
                    });
            }
        };
        $scope.EditBlock = function(block){
            $scope.title = "Update Block";
            $scope.buttontext = "Update";
            editBlock = block;
            $location.path('/createblock');
        };

        $scope.submit = function(){
            if($scope.buttontext == "Update"){
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
                console.log(BlockData);
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