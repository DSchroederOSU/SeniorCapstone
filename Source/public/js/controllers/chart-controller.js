angular.module('chartController', [])
    .controller('chartController', function($route, $scope, Building){


        var randomNum = function(range){
            var num = Math.floor(Math.random() * range);
            return num;
        }

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
        $scope.getData = function(buildings){
            console.log(buildings);
            Building.getBuildingData(buildings)
                .then(function(data) {
                    var d = formatChartData(data);
                    console.log(d);
                });
        };

        function formatChartData(data_entries) {
            console.log(data_entries);
            var to_return = [];
            data_entries.forEach(function(element) {
                to_return.push({time: element.timestamp, data: element.point[0].value});
            });
            return to_return;
        }

        $scope.createCharts = function() {

            //Building Data can be retrieved for each building in the block object
            //My current idea is to make a function to push all of these building objects below to an
            //object array and return that array
            /*********************************SAMPLE BUILDING DATA************************************/
                //x axis
            var Dates = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday', 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
            //y axis data is under the "data" value of these objects
            var Bloss = {name: 'Bloss', data: [86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, 86,114,106,106,107,111,133, ], color: generateColor()};
            var Finley = {name: 'Finley', data: [700,350,411,502,635,809,947 , 700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,700,350,411,502,635,809,947 ,], color: generateColor()};
            var Arnold = {name: 'Arnold', data: [168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, 168,170,178,190,203,276,408, ], color: generateColor()};
            var West = {name: 'West', data: [40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, 40,20,10,16,24,38,74, ], color: generateColor()};
            var Callahan = {name: 'Callahan', data: [6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, 6,3,2,2,7,26,82,172, ], color: generateColor()};
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