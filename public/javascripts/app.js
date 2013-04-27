var PlanMyTripApp = function() {
	'use strict';

	var domain = '/', //'http://mytrip.herokuapp.com/',
		currentSearchLocation,
		currentResult = null,
		searchResults = [],
		tripId,
		// UI
		// Search
		inputForm = document.getElementById('search_form'),
		inputSearch = document.getElementById('q'),
		// Results
		resultImage = document.querySelector('#page_results > img'),
		buttonYes = document.querySelector('.buttons input[value=Yes]'),
		buttonMaybe = document.querySelector('.buttons input[value=Maybe]'),
		buttonNo = document.querySelector('.buttons input[value=No]'),
		resultText = document.querySelector('#page_results .text'),
		resultLandmark = document.querySelector('#page_results h1'),
		resultCity = document.querySelector('#page_results h2'),
		resultDescription = document.querySelector('#page_results .description'),
		// Map
		itineraryMap = document.querySelector('#page_map .map'),
		itineraryList = document.querySelector('#page_map .itinerary')
		;
	
	this.start = function() {

		inputForm.addEventListener('submit', function(e) {
			e.preventDefault();

			var tripLocation = inputSearch.value || inputSearch.placeholder;
			inputSearch.value = tripLocation;
			currentSearchLocation = tripLocation;

			createNewTrip(tripLocation)
				.then(getSuggestions)
				.then(function(results) {
					console.log("RESULTS!!!", results);
					
					showPage('results');
					searchResults = results;
					showNextResult();
				})
				.fail(function() {
					inputSearch.classList.add('error');
				});
			
			return false;
		}, false);

		inputSearch.addEventListener('keypress', function() {
			inputSearch.classList.remove('error');
		}, false);

		buttonYes.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'yes');
		}, false);

		buttonMaybe.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'maybe');
		}, false);

		buttonNo.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'no');
		}, false);

		//showMap();
	};

	function createNewTrip(tripLocation) {
		var deferred = Q.defer();

		// TODO POST /trip/location, get response == trip id
		// ajax(domain + '/trip/' + inputSearch.value)
		console.log('TODO: create trip id for', tripLocation);
		tripId = 'randomid';
		deferred.resolve(tripId);

		return deferred.promise;
	}

	function getSuggestions(id) {
		// /trip/id/suggestions
		var deferred = Q.defer();

		ajax(domain + 'trip/' + id + '/suggestions').then(function(txt) {
			try {
				var results = JSON.parse(txt);
				// TODO preload images
				deferred.resolve(results);
			} catch(e) {
				deferred.reject(e);
			}
		});

		return deferred.promise;
	}

	function showNextResult() {
		if(searchResults.length > 0) {
			var result = searchResults.shift();
			showResult(result);
		} else {
			showMap();
		}
	}

	function showResult(result) {
		var resultsPage = document.getElementById('page_results');

		resultsPage.style.height = 'auto';

		currentResult = result;
		resultImage.src = result.photos[0];
		resultLandmark.innerHTML = result.title;
		resultCity.innerHTML = currentSearchLocation;
		resultDescription.innerHTML = '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p>';

		
		// Hide the description by 'scrolling' it a little bit down
		setTimeout(function() {
			var textHeight = resultText.clientHeight,
				descriptionPos = resultDescription.offsetTop;

			resultsPage.style.height = (resultsPage.clientHeight + textHeight) + 'px';
			
			window.scrollTo(0, descriptionPos + 4);
			
		}, 5);
	}

	function saveResultAndShowNext(result, rating) {
		// TODO actually save it
		console.log('saveResultAndShowNext', rating);
		ajax(domain + tripId + '/' + rating + '/' + result.id, {}, {method: 'post'})
			.fail(function() {
			});
		showNextResult();
	}

	function showMap() {
		// First map with all landmarks
		// On click show landmark + restaurant + cafe
		showPage('map');

		var mapOptions = {
			zoom: 8,
			center: new google.maps.LatLng(-34.397, 150.644),
			mapTypeId: google.maps.MapTypeId.ROADMAP
		},
		map = new google.maps.Map(itineraryMap, mapOptions);

	}

	function showPage(name) {
		var elementId = 'page_' + name,
			elems = document.querySelectorAll('article');

		for(var i = 0; i < elems.length; i++) {
			var el = elems[i];
			if(el.id === elementId) {
				el.classList.remove('hidden');
			} else {
				el.classList.add('hidden');
			}
		}
	}

	// utilities ... should probably be in another file! //
	function ajax(url, data, options) {
		var deferred = Q.defer(),
			httpRequest = new XMLHttpRequest(),
			sendString;

		options = options || {};

		var method = options.method || 'get';

		if(data) {
			method = 'post';
		}

		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200 || httpRequest.status === 0) {
					var data = httpRequest.responseText;
					deferred.resolve(data);
				} else {
					deferred.reject(httpRequest.status);
				}
			}
		};

		
		httpRequest.open(method, url);
		
		if(method === 'post') {
			httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");

			var dataPairs = Object.keys(data).map(function(key) {
				var value = data[key];
				return key + '=' + encodeURIComponent(value);
			});

			sendString = dataPairs.join('&');
		}

		httpRequest.send(sendString);

		console.log('AJAX::open', method, url);

		return deferred.promise;
	}

};
