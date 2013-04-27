var PlanMyTripApp = function() {
	'use strict';

	var domain = '/', //'http://mytrip.herokuapp.com/',
		currentSearchLocation,
		currentResult = null,
		searchResults = [],
		// UI
		// Search
		inputForm = document.getElementById('search_form'),
		inputSearch = document.getElementById('q'),
		// Results
		resultImage = document.querySelector('#page_results > img'),
		buttonYes = document.querySelector('.buttons input[value=Yes]'),
		buttonMaybe = document.querySelector('.buttons input[value=Maybe]'),
		buttonNo = document.querySelector('.buttons input[value=No]'),
		resultLandmark = document.querySelector('#page_results h1'),
		resultCity = document.querySelector('#page_results h2'),
		resultDescription = document.querySelector('#page_results .description')
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
	};

	function createNewTrip(tripLocation) {
		var deferred = Q.defer();

		// TODO POST /trip/location, get response == trip id
		// ajax(domain + '/trip/' + inputSearch.value)
		console.log('TODO: create trip id for', tripLocation);
		deferred.resolve('randomid');

		return deferred.promise;
	}

	function getSuggestions(id) {
		// /trip/id/suggestions
		var deferred = Q.defer();

		ajax(domain + 'trip/' + id + '/suggestions').then(function(txt) {
			try {
				var results = JSON.parse(txt);
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
		currentResult = result;
		resultImage.src = result.photos[0];
		resultLandmark.innerHTML = result.title;
		resultCity.innerHTML = currentSearchLocation;
		resultDescription.innerHTML = '???';
	}

	function saveResultAndShowNext(result, rating) {
		// TODO actually save it
		console.log('saveResultAndShowNext', rating);
		showNextResult();
	}

	function showMap() {
		showPage('map');
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
