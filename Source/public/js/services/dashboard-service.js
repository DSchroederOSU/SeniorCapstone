// js/services/block-service.js
angular.module('DashboardService', [])

// super simple service
// each function returns a promise object
    .factory('Dashboard', function($http) {
        return {
            create : function(dashboardData) {
                return $http.post('/api/addDashboard', dashboardData);
            },
            delete : function(dashboard) {
                return $http.post('/api/deleteDashboard', dashboard);
            },
            edit : function(dashboard) {
                return $http.post('/api/editDashboard', dashboard);
            },
            get : function() {
                return $http.get('/api/getDashboards');
            }
        }
    })








