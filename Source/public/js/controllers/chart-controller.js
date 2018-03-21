var charts = [];
var blockData = [];

angular.module('chartController', [])
    .controller('chartController', function ($route, $scope, $element, $timeout, Building) {

        /*
        This function gets a range int and produces a random number within 
		that specified range.
         */
        var randomNum = function (range) {
            var num = Math.floor(Math.random() * range);
            return num;
        }

        /*
        This function gets either no argument or an array of ranges
		to generate a random unique bright color
         */
        function generateColor(ranges) {
            //https://stackoverflow.com/questions/1484506/random-color-generator
            if (!ranges) {
                ranges = [
                    [150, 256],
                    [0, 190],
                    [0, 30]
                ];
            }
            var g = function () {
                //select random range and remove
                var range = ranges.splice(Math.floor(Math.random() * ranges.length), 1)[0];
                //pick a random number from within the range
                return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
            }
            return "rgb(" + g() + "," + g() + "," + g() + ")";
        };

		/*
        This function gets an array of buildings retrieved from user block object and 
		 and updates a canvas element with a chart based on data parameters
         */
        $scope.createChart = function (buildingsArray) {
            var startDate;
            var endDate;
            var curr = new Date; // get current date
            var last;
            var first;
            first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
            last = first + 6; // last day is the first day + 6
            startDate = new Date(curr.setDate(first));
            startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
            endDate = new Date(curr.setDate(last));
            endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + endDate.getDate();
            //will hold each buildings data in the block
            //x and y axis data
            var x = [];
            var y = [];
            var buildingAxisData = [];

            var to_pass = {
                buildings: buildingsArray.building.map(b => b._id),
                var: buildingsArray.var,
                start: startDate,
                end: endDate
            };
            Building.getBuildingData(to_pass).then(function (data) {

                //console.log(JSON.stringify(data.data, null, 2));
                data.data.forEach(function (buildingData) {

                    x = [];
                    y = [];
                    //console.log(entry);
                    buildingData.points.forEach(function (entry) {
                        if (entry.timestamp && entry.point[0]) {
                            x.push(entry.timestamp);
                            y.push(entry.point[0].value);
                        }
                    });
                    var name = buildingsArray.building.filter(b => b._id == buildingData.id)[0].name;
                    buildingAxisData.push({
                        name: name,
                        buildingYdata: y,
                        buildingXdata: x
                    });
                });
                //push all the values to the array of each buildings x axis data
                //fills buildingAxisData array with building data.
                $scope.chartData = buildingAxisData;
                buildChart(buildingAxisData, buildingsArray.type,buildingsArray.id );
                if(buildingsArray.vals != 'none'){
                    calculateVals(buildingAxisData, buildingsArray.id);
                }
            });

        };

        /*
        This function handles the date filters applied to the chart
        passes a date range into the service to filter results from query
         */
        $scope.filterResults = function (object) {
            var startDate;
            var endDate;
            var curr = new Date; // get current date
            var last;
            var first;

            switch (object.range) {
                case "lastweek":
                    last = curr.getDate() - curr.getDay();
                    first = last - 7; // First day is the day of the month - the day of the week
                    // last day is the first day + 6
                    startDate = new Date(curr.setDate(first));
                    startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
                    endDate = new Date(curr.setDate(last));
                    endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + endDate.getDate();
                    break;
                case "thisweek":
                    first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                    last = first + 6; // last day is the first day + 6
                    startDate = new Date(curr.setDate(first));
                    startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
                    endDate = new Date(curr.setDate(last));
                    endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + endDate.getDate();
                    break;
                default:
                    last = curr.getDate() - curr.getDay();
                    first = last - 7; // First day is the day of the month - the day of the week
                    // last day is the first day + 6
                    startDate = new Date(curr.setDate(first));
                    startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + "00";
                    endDate = new Date(curr.setDate(last));
                    endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + "30";
            }
            //will hold each buildings data in the block
            //x and y axis data
            var x = [];
            var y = [];
            var buildingAxisData = [];
            var to_pass = {
                buildings: object.building.map(b => b._id),
                var: object.var,
                start: startDate,
                end: endDate
            };
            Building.getBuildingData(to_pass).then(function (data) {
                console.log('-----\n--------------------\n-------------')
                console.log(data);
                data.data.forEach(function (buildingData) {
                    x = [];
                    y = [];
                    //console.log(entry);
                    buildingData.points.forEach(function (entry) {
                        if (entry.timestamp && entry.point[0]) {
                            x.push(entry.timestamp);
                            y.push(entry.point[0].value);
                        }
                    });
                    var name = object.building.filter(b => b._id == buildingData.id)[0].name;
                    buildingAxisData.push({
                        name: name,
                        buildingYdata: y,
                        buildingXdata: x
                    });
                });
                //push all the values to the array of each buildings x axis data
                //fills buildingAxisData array with building data.
                $scope.chartData = buildingAxisData;
                updateChart(buildingAxisData, object.index, object.id);
                if(object.vals != 'none'){
                    calculateVals(buildingAxisData, object.id);
                }

            });

        };


        /*
        This function is called as the ng init of the stats section for each block
        it calculates the high, median, and low for each buildings data and pushed them to arrays.
        These arrays are then ng-repeated in the view and the values for each building are displayed in the block
         */
        function calculateVals(dataset, block_id) {
            dataset.forEach(function (currBuilding) {
                var max = {
                    id : block_id,
                    name: parseName(currBuilding.name),
                    max: null,
                    units: null
                };
                var med = {
                    id : block_id,
                    name: parseName(currBuilding.name),
                    med: null,
                    units: null
                };
                var min = {
                    id : block_id,
                    name: parseName(currBuilding.name),
                    min: null,
                    units: null
                };

                max.max = formatNumber(parseInt(Math.max(...currBuilding.buildingYdata), 10));
                max.units = "KwH";
                min.min = formatNumber(parseInt(Math.min(...currBuilding.buildingYdata), 10));
                min.units = "KwH";

                currBuilding.buildingYdata.sort((a, b) => a - b);
                var lowMiddle = Math.floor((currBuilding.buildingYdata.length - 1) / 2);
                var highMiddle = Math.ceil((currBuilding.buildingYdata.length - 1) / 2);
                med.med = formatNumber(parseInt(((currBuilding.buildingYdata[lowMiddle] + currBuilding.buildingYdata[highMiddle]) / 2), 10));
                med.units = "KwH";

                $scope.maxValues.push(max);
                $scope.medValues.push(med);
                $scope.minValues.push(min);
            });
        }

        /*
        This function updates the chart when a new date filter is selected.
        the global array charts holds the chart objects as they are created
        it simply updates the dataset of the calling chart
         */
        function updateChart(buildingAxisData, index, id) {
            $scope.maxValues = [];
            $scope.medValues = [];
            $scope.minValues = [];
            var datasetsArray = [];
            buildingAxisData.forEach(function (element) {
                datasetsArray.push({
                    fill: false,
                    borderColor: generateColor(),
                    label: element.name,
                    data: element.buildingYdata
                });
            });

            var c = charts.find(c => c.id == id);
            c.chart.data.datasets = datasetsArray;
            c.chart.data.labels = buildingAxisData[0].buildingXdata;
            c.chart.update();
        }

        /*
        Function takes shortens the name of buildings. It takes in a building name
		string and returns an abbreviated version if the name has more than 2 words
		or returns the first word if else.
         */
        function parseName(name) {
            if (name.trim().split(/\s+/).length > 2) {
                return name.match(/\b\w/g).join('');
            }
            return name.replace(/ .*/, '');
        };

        //a regex to add commas to integers for better readability
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        };

        //This function simply initializes the scope variable arrays that hold the min/max/median values
        $scope.initVals = function () {
            $scope.maxValues = [];
            $scope.medValues = [];
            $scope.minValues = [];
        };


        /*
        This function is what creates the chart in the canvas element once the data is retrieved and parsed
        the $element is the calling element of the function, which is the canvas element that called createChart
         */
        function buildChart(buildingAxisData, type, id) {
            //function could be made here to dynamically fill the datasetsArray's for each value in block.buildings
            var datasetsArray = [];
            buildingAxisData.forEach(function (element) {
                datasetsArray.push({
                    fill: false,
                    borderColor: generateColor(),
                    label: element.name,
                    data: element.buildingYdata
                });
            });

            //an example of a completed auto generated chart object to be passed to the chart creation function
            var completedChartObj = {
                chartType: type,
                chartYtitle: 'kWh',
                chartDataLabels: buildingAxisData[0].buildingXdata,
                chartDatasets: datasetsArray
            };
            //set current element of the html function call as context for chart
            var ctx = $element.find( "canvas" );

            if(type == 'line'){
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
            }

            charts.push({id: id, chart : myChart});
        }
        $scope.clearCharts = function(){
            charts = [];
        };

        $scope.printCSV =function(block){
            var b = block.building.map(b => b._id);
            Building.csv(b).then(function(csv){
                let csvContent = "data:text/csv;charset=utf-8,";
                csv.data.forEach(function(rowArray){
                    let row = [rowArray].join(",");
                    csvContent += row + "\r\n";
                });

                var encodedUri = encodeURI(csvContent);
                window.open(encodedUri);


            });


        }
    });