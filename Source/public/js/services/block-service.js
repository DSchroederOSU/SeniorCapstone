// js/services/block-service.js
angular.module('BlockService', [])

// super simple service
// each function returns a promise object
    .factory('AddBlock', function($http) {
        return {
            create : function(blockData) {
                return $http.post('/api/addBlock', blockData);
            },
        }
    });