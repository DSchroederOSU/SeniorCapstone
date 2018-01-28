angular.module('mapController', [])
    .controller('mapController', function($scope, $timeout){

		$timeout(function(){  
			$scope.map;
			$scope.markers = [];
			$scope.markerId = 1;
			//Map initialization  
            var latlng = new google.maps.LatLng(44.563780557193354, -123.27947616577148);
			var myStyles = [{featureType: "poi",elementType: "labels", stylers: [{ visibility: "off" }]}];
            var myOptions = {
                zoom: 16,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
				streetViewControl: false,
				fullscreenControl: false,
				Icons: false,
				mapTypeControl: true,
				mapTypeControlOptions: {mapTypeIds: [google.maps.MapTypeId.ROADMAP,google.maps.MapTypeId.SATELLITE]},
				styles: myStyles			
            };
            $scope.map = new google.maps.Map(document.getElementById("map"), myOptions); 
            $scope.overlay = new google.maps.OverlayView();
            $scope.overlay.draw = function() {}; // empty function required
            $scope.overlay.setMap($scope.map);
            $scope.element = document.getElementById('map');

        },100);

	});
	
	
	