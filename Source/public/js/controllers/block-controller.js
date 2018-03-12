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
		
		
		
		$scope.createCharts = function() {// Our labels along the x-axis
			
			//Building Data can be retrieved for each building in the block object
			//My current idea is to make a function to push all of these building objects below to an 
			//object array and return that array
			/*********************************SAMPLE BUILDING DATA************************************/
			//x axis
			var Dates = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
			//y axis data is under the "data" value of these objects
			var Bloss = {name: 'Bloss', data: [86,114,106,106,107,111,133], color: 'blue'};
			var Finley = {name: 'Finley', data: [282,350,411,502,635,809,947], color: 'Green'};
			var Arnold = {name: 'Arnold', data: [168,170,178,190,203,276,408], color: 'Red'};
			var West = {name: 'West', data: [40,20,10,16,24,38,74], color: 'Yellow'};
			var Callahan = {name: 'Callahan', data: [6,3,2,2,7,26,82,172], color: 'Orange'};
			/**********************************************************************************/
			
			//example of an array that has been returned by the function idea above. 
			var buildingDataArray = [Bloss, Finley, Arnold, West, Callahan];
			
			//function could be made here to dynamically fill the datasetsArray's for each value in block.buildings
			var datasetsArray1 = [{ 
							fill: false,
							borderColor: buildingDataArray[0].color,
							label: buildingDataArray[0].name,
							data: buildingDataArray[0].data
						},{ 
							fill: false,
							borderColor: buildingDataArray[1].color,
							label: buildingDataArray[1].name,
							data: buildingDataArray[1].data
						},{ 
							fill: false,
							borderColor: buildingDataArray[2].color,
							label: buildingDataArray[2].name,
							data: buildingDataArray[2].data
						}];
			var datasetsArray2 = [{ 
							fill: false,
							borderColor: buildingDataArray[3].color,
							label: buildingDataArray[3].name,
							data: buildingDataArray[3].data
						},{ 
							fill: false,
							borderColor: buildingDataArray[4].color,
							label: buildingDataArray[4].name,
							data: buildingDataArray[4].data
						}];
			var datasetsArray3 = [{ 
							fill: false,
							borderColor: buildingDataArray[0].color,
							label: buildingDataArray[0].name,
							data: buildingDataArray[0].data
						},{ 
							fill: false,
							borderColor: buildingDataArray[4].color,
							label: buildingDataArray[4].name,
							data: buildingDataArray[4].data
						},];
						
			var datasetsArrayArray = [datasetsArray1,datasetsArray2,datasetsArray3]
			
			//an example of a completed auto generated chart object to be passed to the chart creation function
			var completedChartObj = {chartType:'line', chartYtitle:'kWh', chartDataLabels: Dates, chartDatasets: datasetsArrayArray};
			
			
			//keeps track of blocksChartData[] index
			var blockIndex = 0;
			// get all elements with class "myChart" and create chart for it
			$(".myChart").each(function(index, element){
				//set current element as context for chart
				var ctx = element;
				// create chart
				var myChart = new Chart(ctx, {
					type: completedChartObj.chartType,
					data: {
						labels: completedChartObj.chartDataLabels,
						datasets: completedChartObj.chartDatasets[index] 
					},
					options: {
						scales: {
							yAxes: [{
								scaleLabel: {
									display: true,
									labelString: completedChartObj.chartYtitle
								}
							}]
						}
					}
				});
				//increment block index to get next blocks chart data
				blockIndex++;
			});
		

		}
	});