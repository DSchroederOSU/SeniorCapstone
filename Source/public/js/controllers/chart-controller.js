angular.module('chartController', [])
    .controller('chartController', function($route, $scope, $element, Building){

		//Purpose: returns a random num from a specificied range
		//Input: int
		var randomNum = function(range) {
			var num = Math.floor(Math.random() * range);
			return num;
		}
	
		//Purpose: returns a random color hex code of bright colors
		//Input: Array of int arrays.
		function generateColor(ranges) {
			//https://stackoverflow.com/questions/1484506/random-color-generator
            if (!ranges) {
                ranges = [
                    [150,256],
                    [0, 190],
                    [0, 30]
                ];
            }
            var g = function() {
                //select random range and remove
                var range = ranges.splice(Math.floor(Math.random()*ranges.length), 1)[0];
                //pick a random number from within the range
                return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
            }
            return "rgb(" + g() + "," + g() + "," + g() +")";
        };
		
        function formatChartData(data_entries) {
            //console.log(data_entries);
            var to_return = [];
            data_entries.forEach(function(element) {
                to_return.push({time: element.timestamp, data: element.point[0].value});
            });
			//console.log(to_return);
			
            return to_return;
        };
		
		$scope.createChart = function(buildingsArray) {
			//will hold each buildings data in the block
			var buildingsYaxis = []
			//x and y axis data
			var x = [];
			var y = [];
			
			//console.log(buildings);
            buildingsArray.building.forEach(function(currBuilding) {	
				var to_pass = {building: currBuilding, val : buildingsArray.val};
				Building.getBuildingData(to_pass).then(function(data) {
                    var d = formatChartData(data);
					//reset x and y to get data for next building.
					x = [];
					y = [];
					d.forEach(function(element) {
						//sets the x and y arrays for the chart using the data
						x.push(element.time);
						y.push(element.data);
					});
					//push all the values to the array of each buildings x axis data
					buildingsYaxis.push(y);
					console.log(x);
					console.log(y);
				});
			});
			console.log(buildingsYaxis);
			console.log(x);

			var KEC = {name: 'KEC', data: y, color: generateColor()};
			
			//example of an array that has been returned by the function idea above. 
			var buildingDataArray = [KEC];
			
			//function could be made here to dynamically fill the datasetsArray's for each value in block.buildings
			var datasetsArray = [{ 
							fill: false,
							borderColor: buildingDataArray[0].color,
							label: buildingDataArray[0].name,
							data: buildingDataArray[0].data
						}];
		
			//an example of a completed auto generated chart object to be passed to the chart creation function
			var completedChartObj = {chartType:'line', chartYtitle:'kWh', chartDataLabels: y, chartDatasets: datasetsArray};
			
			
			//set current element of the html function call as context for chart
			var ctx = $element;
			//create the chart on the element
			var myChart = new Chart(ctx, {
				type: completedChartObj.chartType,
				data: {
					labels: completedChartObj.chartDataLabels,
					datasets: completedChartObj.chartDatasets
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
			
			
		};
	});