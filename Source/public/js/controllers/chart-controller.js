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
            var daterange = Last7Days();

            //will hold each buildings data in the block
            //x and y axis data
            var to_pass = {
                buildings: buildingsArray.building.map(b => b._id),
                var: buildingsArray.var,
                start: daterange[0],
                end: daterange[daterange.length -1]
            };
            var buildingAxisData = [];
            Building.getBuildingData(to_pass).then(function (data) {
                //each building's points received from service
                data.data.forEach(function (buildingData) {

                    var name = buildingsArray.building.filter(b => b._id == buildingData.id)[0].name;
                    var chartdata = getDailyData(daterange, buildingData);
                    buildingAxisData.push({name: name, data: chartdata});
                });

                //push all the values to the array of each buildings x axis data
                //fills buildingAxisData array with building data.
                //$scope.chartData = buildingAxisData;
                buildChart(buildingAxisData, buildingsArray.type, buildingsArray.id );
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
                    if(startDate.getDate().toString().length == 1){
                        startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + "0"+startDate.getDate();
                    }
                    else{
                        startDate = "" + startDate.getFullYear() + "-0" + (startDate.getMonth() + 1) + "-" + startDate.getDate();
                    }
                    endDate = new Date(curr.setDate(last));
                    if(endDate.getDate().toString().length == 1){
                        endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + "0"+endDate.getDate();
                    }
                    else{
                        endDate = "" + endDate.getFullYear() + "-0" + (endDate.getMonth() + 1) + "-" + endDate.getDate();
                    }

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
            console.log(startDate);
            console.log(endDate);
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
                data.data.forEach(function (buildingData) {
                    x = [];
                    y = [];
                    //console.log(entry);
                    buildingData.points.forEach(function (entry) {
                        if (entry.timestamp && entry.point[0]) {
                            x.push(entry.timestamp);
                            if(entry.point[0].value < 0){
                                y.push(-1*entry.point[0].value);
                            }
                            else{ y.push(entry.point[0].value);}
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
                if(object.vals != 'none') {
                    $scope.maxValues = $scope.maxValues.filter(b => b.id != object.id);
                    $scope.medValues = $scope.medValues.filter(b => b.id != object.id);
                    $scope.minValues = $scope.minValues.filter(b => b.id != object.id);
                }
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
            console.log(dataset);
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
                var values = currBuilding.data.map(x => x.val);

                max.max = formatNumber(parseInt(Math.max(...values), 10));
                max.units = "KwH";
                min.min = formatNumber(parseInt(Math.min(...values), 10));
                min.units = "KwH";
                console.log(max);
                values.sort((a, b) => a - b);
                var lowMiddle = Math.floor((values.length - 1) / 2);
                var highMiddle = Math.ceil((values.length - 1) / 2);
                med.med = formatNumber(parseInt(((values[lowMiddle] + values[highMiddle]) / 2), 10));
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
            charts = [];
        };


        /*
        This function is what creates the chart in the canvas element once the data is retrieved and parsed
        the $element is the calling element of the function, which is the canvas element that called createChart
         */
        function buildChart(buildingAxisData, type, id) {
            console.log(buildingAxisData[0].data.map(x=> x.date));
            //function could be made here to dynamically fill the datasetsArray's for each value in block.buildings
            var datasetsArray = [];
            buildingAxisData.forEach(function (element) {

                datasetsArray.push({
                    fill: false,
                    borderColor: generateColor(),
                    label: element.name,
                    data: element.data.map(x=> x.val)
                });
            });

            //an example of a completed auto generated chart object to be passed to the chart creation function
            var completedChartObj = {
                chartType: type,
                chartYtitle: 'kWh',
                chartDataLabels: buildingAxisData[0].data.map(x=> x.date),
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
        };

        function formatDate(date){
            var dd = date.getDate();
            var mm = date.getMonth()+1;
            var yyyy = date.getFullYear();
            if(dd<10) {dd='0'+dd}
            if(mm<10) {mm='0'+mm}
            date = yyyy+'-'+mm+'-'+dd;
            return date
        }

        function Last7Days() {
            var result = [];
            for (var i=0; i<7; i++) {
                var d = new Date();
                d.setDate(d.getDate() - i);
                result.push( formatDate(d).toString() )
            }
            return(result.sort());
        }

        /*
        Input:
        range - Array of date string
        data - {id: "5aab1076dbdd3c325439a214",
                points: [ {building: "5aab1076dbdd3c325439a214",
                           timestamp: "2018-03-29 00:00:00",
                           point: 469646.06}
                        ]
                }
         */
        function getDailyData(range, data){
            var to_return = [];
            range.forEach(function (date){
                //get data points for just one whole day
                var temp = data.points.filter(p => {
                    if(p)
                        return p.timestamp.substring(0,10) == date
                });
                if (temp.length > 0){
                    //find the consumption for that day by subtracting
                    //net accumulated at 23:45:00 from net accumulated at 00:00:00
                    var dif = Math.abs(temp[temp.length-1].point) - Math.abs(temp[0].point);
                    to_return.push({date: temp[0].timestamp.substring(0,10), val: dif});
                }
            });
            return to_return;
        }

    });