// js/services/block-service.js
angular.module('BlockService', [])

// super simple service
// each function returns a promise object
    .factory('Block', function($http) {
        return {
            create : function(blockData) {
                return $http.post('/api/addBlock', blockData);
            },
            delete : function(block) {
                return $http.post('/api/deleteBlock', block);
            },
            edit : function(block) {
                return $http.post('/api/editBlock', block);
            },
            get : function() {
                return $http.get('/api/getUserBlocks');
            }
        }
    })
    .factory('GetBlockByID', function($http) {
        return {
            get : function(block) {
                return $http({
                                url: '/api/getBlockById',
                                method: "GET",
                                params: {block_id: block._id}
                            });

            }
        }
    });

