// js/services/block-service.js
angular.module('BlockService', [])

// super simple service
// each function returns a promise object
    .factory('AddBlock', function($http) {
        return {
            create : function(blockData) {
                return $http.post('/api/addBlock', blockData);
            }
        }
    })
    .factory('GetUserBlocks', function($http) {
        return {
            get : function() {
                return $http.get('/api/getUserBlocks');
            }
        }
    })
    .factory('DeleteBlock', function($http) {
        return {
            delete : function(block) {
                return $http.post('/api/deleteBlock', block);
            }
        }
    });

