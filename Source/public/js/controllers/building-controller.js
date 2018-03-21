var selectedBuilding;
var selectedMeters = [];
var dropdownMeters = [];
var editBuilding;
angular.module('buildingController', [])
    .controller('buildingController', function ($scope, $location, $route, Building, Meter) {
        selectedMeters = [];
        /*---------------------------------------------------------------------------------------
        ------------------------------------CREATE FUNCTIONS-------------------------------------
        ---------------------------------------------------------------------------------------*/

        function CreateBuilding() {
            // validate the formData to make sure that something is there
            // if form is empty, nothing will happen
            // people can't just hold enter to keep adding the same to-do anymore
            if (!$.isEmptyObject($scope.nameForm)) {
                // call the create function from our service (returns a promise object)
                var buildingData = {
                    "name": $scope.nameForm,
                    "building_type": $scope.buildingSelection,
                    "meters": selectedMeters
                };
                Building.create(buildingData)
                    // if successful creation
                    .success(function (building) {
                        $scope.nameForm = "";
                        $scope.serialForm = "";
                        $location.path('/allBuildings')
                    });
            }
        }
        /*
        This function is called on ng-click of the create block button in blocks.html
        makes sure that our edit variable is null to indicate we are creating
        */
        $scope.create = function () {
            editBuilding = null;
        };

        /*---------------------------------------------------------------------------------------
        ----------------------------------EDIT/UPDATE FUNCTIONS----------------------------------
        ---------------------------------------------------------------------------------------*/
        $scope.EditBuilding = function (block) {
            editBuilding = block;
            $location.path('/addBuilding');
        };

        function UpdateBuilding(building) {
            var update_building_data = {
                "_id": building._id,
                "name": $scope.nameForm,
                "building_type": $scope.buildingSelection,
                "meters": selectedMeters
            };
            Building.update(update_building_data)
                .success(function () {
                    $location.path('/allBuildings')
                });
        }
        /*---------------------------------------------------------------------------------------
        -------------------------------------VIEW FUNCTIONS--------------------------------------
        ---------------------------------------------------------------------------------------*/
        $scope.viewBuilding = function (building) {
            selectedBuilding = building;
            $scope.BuildingName = building.name;
            $scope.buildingModel = building;
            $location.path('/viewBuilding');
        };

        $scope.getViewBuilding = function () {
            $scope.buildingModel = selectedBuilding;
        };
        /*
        This function is called as an ng-init directive of the meter table in viewBuilding
        INPUT: the current buildingModel of the building being viewed
        OUTPUT: calls a service to retrieve building meters so table can populate dynamically
         */
        $scope.getBuildingData = function (building) {
            Building.getById(building._id).then(function (data) {
                $scope.buildingMeters = data.meters;
            });
        };
        $scope.getImageAddress = function (building) {
            if (building._id != null) {
                return "../assets/buildings/" + building.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            } else if (selectedBuilding._id != null) {
                return "../assets/buildings/" + selectedBuilding.name.replace(/\s+/g, '-').toLowerCase() + ".jpg";
            }
        };

        /*---------------------------------------------------------------------------------------
        -------------------------------------MISC FUNCTIONS--------------------------------------
        ---------------------------------------------------------------------------------------*/
        $scope.getRankings = function () {
            var to_pass = {
                buildings: $scope.buildings,
                start: startDate,
                end: endDate
            };
            Building.getBuildingData(to_pass).then(function (data) {
                $scope.buildingRanks = data;
            });
        };


        /*
        A function called on ng-init of title H4 in create-block.html
        Sets scope variables depending on if user is creating or editing
        Sets title heading and submit button text
        */
        $scope.getTitle = function () {
            if (editBuilding == null) {
                $scope.title = "Create Building";
                $scope.buttontext = "Create";
            } else {
                $scope.title = "Update Building";
                $scope.buttontext = "Update";
            }
        };


        /*
        A function called on ng-init of the nameForm input tag
        prepopulates input form with the name of the block being edited
        */
        $scope.getName = function () {
            if (editBuilding != null) {
                $scope.nameForm = editBuilding.name;
            }
        };

        Building.get()
            .success(function (data) {
                $scope.buildings = data;
            });

        /*
        A function called on ng-init of the dropdown menu for meters
        This function checks the editBuilding variable to see if the user is editing or not

        If Edit:
            variable editBuilding.meters has the meter id's of the current building
        and then calls Meter.get to populate the drop down of meters
        The function then removes the meters in the editBuilding from the dropdown and
        adds them to the selected meters list group as if to "pre-populate" selections

        If creating:
        Calls the Building.get service to populate dropdown
        */
        $scope.getBuildingMeters = function () {
            if (editBuilding != null) {
                Meter.get()
                    .then(function (data) {
                        dropdownMeters = data.data;
                        $scope.selectedBuildings = "";
                        editBuilding.meters.forEach(function (meter) {
                            var count = 0;
                            dropdownMeters.forEach(function (obj) {
                                if (obj._id == meter) {
                                    dropdownMeters.splice(count, 1);
                                    selectedMeters.push(obj);
                                    count++;
                                } else count++;
                            });
                        });

                        $scope.meters = dropdownMeters;
                        $scope.selectedMeters = selectedMeters;
                        $scope.meterSelection = "";
                    });
            } else {
                Meter.get()
                    .success(function (data) {
                        $scope.meterSelection = "";
                        dropdownMeters = data;
                        $scope.meters = data;
                    });
            }
        };

        $scope.getBuildingType = function () {
            if (editBuilding != null) {
                console.log(editBuilding);
                $scope.buildingSelection = editBuilding.building_type;

            }
        };



        $scope.DeleteBuilding = function (building) {
            Building.delete(building)
                .success(function () {
                    $location.path('/allBuildings');
                });
        };

        $scope.formatDate = function (date) {
            return "" + date.substring(0, 10) + " " + date.substring(14, 19).replace(/^0+/, '')
        };

        $scope.getDataDay = function (date) {
            console.log(date.substring(9, 10));
            return parseInt(date.substring(9, 10))
        };

        $scope.selection = function (meter) {
            selectedMeters.push(meter);
            var index = dropdownMeters.indexOf(meter);
            if (index > -1) {
                dropdownMeters.splice(index, 1);
            }
            $scope.meters = dropdownMeters;
            $scope.selectedMeters = selectedMeters;
            $scope.meterSelection = "";
        };

        $scope.removeMeter = function (meter) {
            dropdownMeters.push(meter);
            var index = selectedMeters.indexOf(meter);
            if (index > -1) {
                selectedMeters.splice(index, 1);
            }
            $scope.meters = dropdownMeters;
            $scope.selectedMeters = selectedMeters;
            $scope.meterSelection = "";
        };

        $scope.submit = function () {
            if (editBuilding == null) {
                CreateBuilding();
            } else {
                /*
                Need to create an "Update" function and API
                 */
                UpdateBuilding(editBuilding);
            }
        };

    });