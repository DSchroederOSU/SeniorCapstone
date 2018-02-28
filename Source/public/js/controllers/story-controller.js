var selectedDashboards = [];
var dropdownDashboards = [];
angular.module('storyController', [])
    .controller('storyController', function($route, $scope, $location, Dashboard, Story) {

        selectedDashboards = [];
        $scope.user_dashboards = [];

        Dashboard.get()
        .success(function (data) {
            $scope.user_dashboards = data;
            dropdownDashboards = data;
        });

        $scope.selection = function(dashboard) {
            selectedDashboards.push(dashboard);
            var index = dropdownDashboards.indexOf(dashboard);
            if (index > -1) {
                dropdownDashboards.splice(index, 1);
            }
            $scope.user_dashboards = dropdownDashboards;
            $scope.selectedDashboards = selectedDashboards;
            $scope.dashboardSelection = "";
        };

        $scope.removeDashboard = function(dashboard) {
            dropdownDashboards.push(dashboard);
            var index = selectedDashboards.indexOf(dashboard);
            if (index > -1) {
                selectedDashboards.splice(index, 1);
            }
            $scope.user_dashboards = dropdownDashboards;
            $scope.selectedDashboards = selectedDashboards;
            $scope.dashboardSelection = "";
        };

        $scope.CreateStory = function() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm))  {
                // call the create function from our service (returns a promise object)
                var StoryData = {
                    "name": $scope.nameForm,
                    "dashboards": selectedDashboards
                };

                Story.create(StoryData)
                // if successful creation
                    .success(function(data) {
                        $scope.nameForm = "";
                        $location.path('/');
                    });
            }
        };


    });