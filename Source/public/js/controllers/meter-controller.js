angular.module('meterController', [])
    .controller('meterController', function($scope, Meter, Building) {


        Building.get()
            .success(function (data) {
                $scope.buildings = data;
                $scope.buildingSelection = data[0];
            });


        $scope.CreateMeter = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm) && !$.isEmptyObject($scope.serialForm))  {
                // call the create function from our service (returns a promise object)
                var meterData = {
                    "name": $scope.nameForm,
                    "meter_id": $scope.serialForm,
                    "building": $scope.buildingSelection
                };
                console.log($scope.buildingSelection);
                Meter.create(meterData)
                // if successful creation
                    .success(function(meter) {
                        $scope.nameForm = "";
                        $scope.serialForm = "";
                        //$location.path('/meters');
                    });
            }
        };
        $scope.DeleteMeter = function(meter){
            Meter.delete(meter)
                .success(function() {
                    $route.reload();
                });
        }

    });