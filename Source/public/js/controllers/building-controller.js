var selectedBuilding;
var selectedMeters = [];
var dropdownMeters = [];
angular.module('buildingController', [])
    .controller('buildingController', function($scope,$location, $route, Building, Meter) {


        selectedMeters = [];
        $scope.meters = [];
        $scope.buildingMeters = [];
        $scope.buildingModel = selectedBuilding;
       
        Meter.get()
            .success(function (data) {
               
                $scope.meterSelection = data[0];
                dropdownMeters = data;
                $scope.meters = data;
        });

        Building.get()
            .success(function (data) {
                $scope.buildings = data;
            });
        $scope.getImageAddress = function(building) {
            if (building._id != null){
                console.log(building);
                return "../assets/buildings/"+ building.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            }
            else if(selectedBuilding._id != null){
                return "../assets/buildings/"+ selectedBuilding.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            }
        };
        $scope.viewBuilding = function(building) {
            selectedBuilding = building;
            $scope.BuildingName = building.name;
            $scope.currentBuilding = selectedBuilding;
<<<<<<< HEAD
            console.log(building);

=======
            Building.getById($scope.currentBuilding._id).success(function(data) {
                
                $scope.buildingMeters = data.meters;               
            });
            
        };
        
        $scope.DeleteBuilding = function(building){
            Building.delete(building)
                .success(function() {
                    $route.reload();
                });
>>>>>>> d57526fed285556016807cefad3959a6d48781d9
        };
        $scope.formatDate = function(date){
            return "" + date.substring(0,10) + " " + date.substring(14,19).replace(/^0+/, '')
        };

        $scope.getDataDay = function(date){
            console.log(date.substring(9,10));
            return parseInt(date.substring(9,10))
        };
        $scope.editBuilding = function(building){
         
        };

        $scope.selection = function(meter) {
            selectedMeters.push(meter);
            var index = dropdownMeters.indexOf(meter);
            if (index > -1) {
                dropdownMeters.splice(index, 1);
            }
            $scope.meters = dropdownMeters;
            $scope.selectedMeters = selectedMeters;
            $scope.meterSelection = "";
        };

        $scope.removeMeter = function(meter) {
            dropdownMeters.push(meter);
            var index = selectedMeters.indexOf(meter);
            if (index > -1) {
                selectedMeters.splice(index, 1);
            }
            $scope.meters = dropdownMeters;
            $scope.selectedMeters = selectedMeters;
            $scope.meterSelection = "";
        };

        $scope.CreateBuilding = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm))  {
                // call the create function from our service (returns a promise object)
                var buildingData = {
                    "name": $scope.nameForm,
                    "building_type": $scope.buildingSelection,
                    "meters": selectedMeters
                };
                Building.create(buildingData)
                // if successful creation
                    .success(function(building) {
                        $scope.nameForm = "";
                        $scope.serialForm = "";
                        // $location.path('/meters');
                    });
            }
        };
    });