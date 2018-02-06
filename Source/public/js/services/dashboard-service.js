// js/services/block-service.js
angular.module('DashboardService', [])

// super simple service
// each function returns a promise object
    .factory('AddDashboard', function($http) {
        return {
            create : function(dashboardData) {
                return $http.post('/api/addDashboard', dashboardData);
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

