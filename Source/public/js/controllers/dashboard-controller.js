var selectedBlocks = [];
var dropdownBlocks = [];
angular.module('dashboardController', [])
    .controller('dashboardController', function($route, $scope, $location, GetDashboards, GetUserBlocks, AddDashboard, DeleteDashboard) {

        GetDashboards.get()
            .success(function (data) {
                $scope.dashboards = data;

            });
        GetUserBlocks.get()
            .success(function(data) {
                dropdownBlocks = data;
                $scope.userBlocks = data;
            });

        $scope.selection = function(block) {
            selectedBlocks.push(block);
            var index = dropdownBlocks.indexOf(block);
            if (index > -1) {
                dropdownBlocks.splice(index, 1);
            }
            $scope.blocks = dropdownBlocks;
            $scope.selectedBlocks = selectedBlocks;
            $scope.blockSelection = "";
        };

        $scope.removeBlock = function(block) {
            dropdownBlocks.push(block);
            var index = selectedBlocks.indexOf(block);
            if (index > -1) {
                selectedBlocks.splice(index, 1);
            }
            $scope.blocks = dropdownBlocks;
            $scope.selectedBlocks = selectedBlocks;
            $scope.blockSelection = "";
        };
        $scope.CreateDashboard = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm) && !$.isEmptyObject($scope.descriptionForm))  {
                // call the create function from our service (returns a promise object)
                var DashboardData = {
                    "name": $scope.nameForm,
                    "description": $scope.descriptionForm,
                    "blocks": selectedBlocks
                };

                AddDashboard.create(DashboardData)
                // if successful creation
                    .success(function(data) {
                        $scope.nameForm = "";
                        $scope.descriptionForm = "";
                        $location.path('/dashboards');
                    });
            }
        };
        $scope.DeleteDashboard = function(dashboard){
            DeleteDashboard.delete(dashboard)
                .success(function() {
                    $route.reload();
                });
        }
    });