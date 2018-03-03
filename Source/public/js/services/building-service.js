// js/services/building-service.js
angular.module('BuildingService', [])

// super simple service
// each function returns a promise object
    .factory('Building', function($http) {
        return {
            create : function(buildingData) {
                return $http.post('/api/addBuilding', buildingData);
            },
            get : function() {
                return $http.get('/api/buildings');
            }
        }
    });