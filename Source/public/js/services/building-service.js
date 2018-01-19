// js/services/building-service.js
angular.module('BuildingService', [])

// super simple service
// each function returns a promise object
    .factory('GetBuildings', function($http) {
        return {
            get : function() {
                return $http.get('/api/buildings');
            }
        }
    });