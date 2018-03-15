angular.module('chartController', [])
    .controller('chartController', function($route, $scope, $element, $timeout, Building){

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
		$scope.createChart = function(buildingsArray) {
			//will hold each buildings data in the block
			//x and y axis data
			var x = [];
			var y = [];
			var buildingAxisData = [];
	
			//fills buildingAxisData array with building data.
			//
            buildingsArray.building.forEach(function(currBuilding) {	
				var to_pass = {building: currBuilding, val : buildingsArray.val};
				Building.getBuildingData(to_pass).then(function(data) {
                    x = [];
                    y = [];
					data.forEach( function(entry){
                        x.push(entry.timestamp);
                        y.push(entry.point[0].value);
					});
					//push all the values to the array of each buildings x axis data
					buildingAxisData.push({name: to_pass.building.name, buildingYdata: y, buildingXdata: x});
                    //function could be made here to dynamically fill the datasetsArray's for each value in block.buildings
                    var datasetsArray = [];
                    buildingAxisData.forEach(function(element) {
                        datasetsArray.push({
                            fill: false,
                            borderColor: generateColor(),
                            label: element.name,
                            data: element.buildingYdata
                        });
                    });

                    //an example of a completed auto generated chart object to be passed to the chart creation function
                    var completedChartObj = {chartType:'line', chartYtitle:'kWh', chartDataLabels: buildingAxisData[0].buildingXdata, chartDatasets: datasetsArray};


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
				});
			});

			//timeout necessary to let data load. This is a dumb way to handle asynchronous-ness but it works for now.
			$timeout(function () {

				console.log(buildingAxisData);


			}, 5000);

		};
	});