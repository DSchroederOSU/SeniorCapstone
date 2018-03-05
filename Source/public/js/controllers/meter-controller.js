angular.module('meterController', [])
    .controller('meterController', function($scope, $location, $route, Meter, Building) {
        $scope.buttonText = "Create";
        $scope.meterFormTitle = "Add a Meter";
        Meter.get()
            .success(function (data) {
                $scope.meters = data;
            });

        Building.get()
            .success(function (data) {
                $scope.buildings = data;
                $scope.buildingSelection = data[0];
            });


        $scope.editMeter = function(meter){

        };
        $scope.addMeter = function(meter){
            $location.path('/addmeter');
        };

        $scope.submit = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.meterNameForm) && !$.isEmptyObject($scope.meterSerialForm))  {
                // call the create function from our service (returns a promise object)
                var meterData = {
                    "name": $scope.meterNameForm,
                    "meter_id": $scope.meterSerialForm,
                    "building": $scope.buildingSelection
                };

                Meter.create(meterData)
                // if successful creation
                    .success(function(meter) {
                        $scope.meterNameForm = "";
                        $scope.meterSerialForm = "";
                        $location.path('/meters');
                    });
            }
        };
        $scope.DeleteMeter = function(meter){
            Meter.delete(meter)
                .success(function() {
                    $route.reload();
                });
        };

    });