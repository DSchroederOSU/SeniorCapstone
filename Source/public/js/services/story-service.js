// js/services/story-service.js
angular.module('StoryService', [])

// super simple service
// each function returns a promise object
    .factory('Story', function($http) {
        return {
            create : function(storyData) {
                return $http.post('/api/addStory', storyData);
            },
            delete : function(story) {
                return $http.post('/api/deleteStory', story);
            },
            edit : function(story) {
                return $http.post('/api/editStory', story);
            },
            get : function() {
                return $http.get('/api/getUserStories');
            }
        }
    })