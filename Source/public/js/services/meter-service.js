// js/services/block-service.js
angular.module('MeterService', [])

// super simple service
// each function returns a promise object
    .factory('Meter', function($http) {
        return {
            create : function(meterData) {
                return $http.post('/api/addMeter', meterData);
            },
            delete : function(meter) {
                return $http.post('/api/deleteMeter', meter);
            },
            edit : function(meter) {
                return $http.post('/api/editMeter', meter);
            },
            get : function() {
                return $http.get('/api/getMeters');
            }
        }
    });

