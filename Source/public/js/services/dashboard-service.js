// js/services/block-service.js
angular.module('DashboardService', [])

// super simple service
// each function returns a promise object
    .factory('AddBlock', function($http) {
        return {
            create : function(blockData) {
                return $http.post('/api/addBlock', blockData);
            }
        }
    })
    .factory('GetDashboards', function($http) {
        return {
            get : function() {
                return $http.get('/api/getDashboards');
            }
        }
    });

