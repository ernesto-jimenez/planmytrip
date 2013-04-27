var PlanMyTripApp = function() {
	'use strict';

	var domain = 'http://mytrip.herokuapp.com/',
		inputForm = document.getElementById('search_form'),
		inputSearch = document.getElementById('q');
	
	this.start = function() {

		inputForm.addEventListener('submit', function(e) {
			e.preventDefault();

			createNewTrip()
				.then(getSuggestions)
				.then(showSearchResults)
				.fail(function() {
					inputSearch.classList.add('error');
				});
			
			return false;
		}, false);

		inputSearch.addEventListener('keypress', function() {
			inputSearch.classList.remove('error');
		}, false);

	};

	function createNewTrip() {
		var deferred = Q.defer();

		// TODO POST /trip/location, get response == trip id
		// ajax(domain + '/trip/' + inputSearch.value)

		deferred.resolve('randomid');

		return deferred.promise;
	}

	function getSuggestions(id) {
		///trip/id/suggestions
		var deferred = Q.defer();

		ajax(domain + id + '/suggestions').then(function(txt) {
			try {
				var results = JSON.decode(txt);
				deferred.resolve(results);
			} catch(e) {
				deferred.reject();
			}
		});

		return deferred.promise;
	}

	function showSearchResults(results) {
		console.log("RESULTS!!!", results);
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
					deferred.reject();
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
