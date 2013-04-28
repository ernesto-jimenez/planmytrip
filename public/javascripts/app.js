var PlanMyTripApp = function() {
	'use strict';

	var domain = '/', //'http://mytrip.herokuapp.com/',
		currentSearchLocation,
		currentResult = null,
		searchResults = [],
		numChosenResults = 0,
		tripId,
		slideShowTimeout = null,
		// UI
		// Search
		searchBg = document.querySelector('#page_index img'),
		inputForm = document.getElementById('search_form'),
		inputSearch = document.getElementById('q'),
		inputGo = document.querySelector('#page_index input[type=submit]'),
		// Results
		resultImage = document.querySelector('#page_results > img'),
		buttonYes = document.querySelector('.buttons img[data-value=Yes]'),
		buttonMaybe = document.querySelector('.buttons img[data-value=Maybe]'),
		buttonNo = document.querySelector('.buttons img[data-value=No]'),
		resultText = document.querySelector('#page_results .text'),
		resultLandmark = document.querySelector('#page_results h1'),
		resultCity = document.querySelector('#page_results h2'),
		resultDescription = document.querySelector('#page_results .description'),
		// Map
		itineraryMapContainer = document.querySelector('.mapContainer'),
		itineraryMap = document.querySelector('#page_map .map'),
		itineraryList = document.querySelector('#page_map .itinerary')
		;

	this.start = function() {

		inputForm.addEventListener('submit', function(e) {
			e.preventDefault();

			inputGo.disabled = 'disabled';
      inputGo.value = "Loading…";

			var tripLocation = inputSearch.value || inputSearch.placeholder;
			inputSearch.value = tripLocation;
			currentSearchLocation = tripLocation;

			createNewTrip(tripLocation)
				.then(getSuggestions)
				.then(function(results) {
					console.log("RESULTS!!!", results);

					searchResults = results;
					showPage('results', showNextResult);
				})
				.fail(function() {
					inputSearch.classList.add('error');
				});

			return false;
		}, false);

		inputSearch.addEventListener('keypress', function() {
			inputSearch.classList.remove('error');
			// TODO change bg image as soon as location is detected
		}, false);

		resultImage.addEventListener('load', function() {
			fitImage(resultImage, window.innerWidth, window.innerHeight);
		}, false);

		[ buttonYes, buttonNo, buttonMaybe ].forEach(function(btn) {
			btn.dataset['original_src'] = btn.src;
			btn.addEventListener('mouseover', function() {
				btn.src = btn.dataset['hover'];
			}, false);

			btn.addEventListener('mouseout', function() {
				btn.src = btn.dataset['original_src'];
			}, false);
		});

		buttonYes.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'yes');
			restoreButtonSrc(buttonYes);
		}, false);

		buttonMaybe.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'maybe');
			restoreButtonSrc(buttonMaybe);
		}, false);

		buttonNo.addEventListener('click', function() {
			saveResultAndShowNext(currentResult, 'no');
			restoreButtonSrc(buttonNo);
		}, false);

		window.addEventListener('resize', function() {
			resizeBackgroundImages();
		});

		setTimeout(resizeBackgroundImages, 5);

		//showMap();
	};

	function restoreButtonSrc(button) {
		button.src = button.dataset['original_src'];
	}

	function createNewTrip(tripLocation) {

		return ajax(domain + 'trip', {
			city: inputSearch.value
		}, { method: 'post' });
	}

	function getSuggestions(id) {
		// /trip/id/suggestions
		var deferred = Q.defer();

		tripId = id;

		ajax(domain + 'trip/' + id + '/suggestions').then(function(txt) {
			try {
				var results = JSON.parse(txt);
				numChosenResults = 0;
				results.forEach(function(res) {
					res.photos.forEach(preloadImage);
				});
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
		var resultsPage = document.getElementById('page_results'),
			resultsText = document.querySelector('#page_results .text');

		resultsPage.style.height = 'auto';

		currentResult = result;
		resultImage.src = result.photos[0];
		resultLandmark.innerHTML = result.title;
		resultCity.innerHTML = currentSearchLocation;
		resultDescription.innerHTML = result.description || "";

		if(slideShowTimeout !== null) {
			clearTimeout(slideShowTimeout);
		}


		resultsText.style.visibility = 'hidden';
		resultsText.style.opacity = 0;

		startSlideShow(resultImage, result.photos, function() {
			setTimeout(positionResultsText, 15);

		});

	}

	function positionResultsText() {
		var resultsPage = document.getElementById('page_results'),
			resultsText = document.querySelector('#page_results .text');

		var textHeight = resultText.clientHeight,
			descriptionPos = resultDescription.offsetTop;

		resultsPage.style.height = (resultsPage.clientHeight + textHeight) + 'px';
		resultsText.style.visibility = 'visible';
		resultsText.style.opacity = 1;
		window.scrollTo(0, descriptionPos + 4);

	}


	function startSlideShow(imgElem, photos, onStartCb) {
		var currentIndex = photos.indexOf(imgElem.src),
			timeoutLength = 5000;

		imgElem.style.opacity = 0;
		imgElem.src = photos[currentIndex];

		function nextPhoto() {
			imgElem.style.opacity = 0;

			setTimeout(function() {
				imgElem.src = photos[currentIndex];
				imgElem.style.opacity = 1;
			}, 250);

			clearTimeout(slideShowTimeout);
			slideShowTimeout = setTimeout(nextPhoto, timeoutLength);
			currentIndex = ++currentIndex % photos.length;
			return slideShowTimeout;
		}


		setTimeout(function() {
			imgElem.style.opacity = 1;
			clearTimeout(slideShowTimeout);
			slideShowTimeout = setTimeout(nextPhoto, timeoutLength);
			onStartCb();
		}, 5);

		//return nextPhoto();

	}

	function saveResultAndShowNext(result, rating) {
		
		console.log('saveResultAndShowNext', rating);
		if(result.id !== undefined) {
			ajax(domain + 'trip/' + tripId + '/' + rating + '/' + result.id, {}, {method: 'post'}).then(function() {
				})
				.fail(function() {
				});
		}

		if(rating !== 'no') {
			numChosenResults++;
		}

		if(numChosenResults < 10) {
			showNextResult();
		} else {
			showMap();
		}
	}

	function showMap() {

		// TODO get trip landmarks from server, then show map
		ajax(domain + 'trip/' + tripId + '.json')
			.then(function(response) {

				// First map with all landmarks
				// On click show landmark + restaurant + cafe
				showPage('map');

				// TODO calculate average lat/lng and use to center map
				var mapOptions = {
					zoom: 8,
					center: new google.maps.LatLng(-34.397, 150.644),
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};

				//var map = new google.maps.Map(itineraryMap, mapOptions);

				//Draw markers
				var results = JSON.parse(response),
					list = document.createElement('ul'),
					mapImg = document.createElement('img'),
					mapWidth = Math.round(window.innerWidth),
					mapHeight = Math.round(window.innerHeight * 0.4);

				mapImg.src = 'http://maps.googleapis.com/maps/api/staticmap?center=' + currentSearchLocation + 'zoom=13&size=' + mapWidth + 'x' + mapHeight + '&maptype=roadmap&markers=color:blue|label:S|40.702147,-74.015794&markers=color:green|label:G|40.711614,-74.012318&markers=color:red|color:red|label:C|40.718217,-73.998284&sensor=false';

				itineraryMap.appendChild(mapImg);

				numChosenResults = 0;
				results.forEach(function(res) {

					//var myLatlng = new google.maps.LatLng(res.location['lat'],res.location['lng']);

					/*var marker = new google.maps.Marker({
					    position: myLatlng,
					    title: res.location['name']
					});

					var infowindow = new google.maps.InfoWindow({
    					content: '<div id="content">'+res.location['name']+'</div>'
					});

					marker.setMap(map);

					google.maps.event.addListener(marker, 'click', function() {
  						infowindow.open(map,marker);
					});

					marker.setMap(map);*/

					var li = renderLandmarkList(res);
					list.appendChild(li);
				});

				window.scrollTo(0, 0);
				itineraryList.appendChild(list);

			});
	}

	function renderLandmarkList(landmark) {

		var li = document.createElement('li'),
			address = landmark.location.address,
			postCode = landmark.location.postalCode,
			txt = '';

		txt = '<h2>' + landmark.name + '</h2>' +
						'<em>' + landmark.location.address ; 
		
		if(postCode !== undefined) {
			txt += ', ' + landmark.location.postalCode;
		}
		
		txt += '</em>';

		li.innerHTML = txt;

		return li;


	}

	function showPage(name, visibleCallback) {
		var elementId = 'page_' + name,
			elems = document.querySelectorAll('article');

		visibleCallback = visibleCallback || function() {};

		// current page -> fade out
		// next page -> fade in
		var currentPage, nextPage;

		for(var i = 0; i < elems.length; i++) {

			var el = elems[i];

			if(el.id === elementId) {
				nextPage = el;
			} else if(! el.classList.contains('hidden')) {
				currentPage = el;
			}

		}

		currentPage.addEventListener('transitionend', onTransitionEnd, false);
		currentPage.addEventListener('webkitTransitionEnd', onTransitionEnd, false);
		currentPage.style.opacity = 0;

		function onTransitionEnd() {

			currentPage.removeEventListener('transitionend', onTransitionEnd, false);
			currentPage.removeEventListener('webkitTransitionEnd', onTransitionEnd, false);

			currentPage.classList.add('hidden');

			nextPage.addEventListener('transitionend', onNextTransitionEnd, false);
			nextPage.addEventListener('webkitTransitionEnd', onNextTransitionEnd, false);

			nextPage.style.display = 'block';

			setTimeout(function() {
				nextPage.classList.remove('hidden');
			}, 1);

		}

		function onNextTransitionEnd() {
			nextPage.removeEventListener('transitionend', onNextTransitionEnd, false);
			nextPage.removeEventListener('webkitTransitionEnd', onNextTransitionEnd, false);
			visibleCallback();
		}
	}


	// Function for adding a marker to the page.
    function addLocation(lat,lng) {



	}

	function resizeBackgroundImages() {
		var w = window.innerWidth,
			h = window.innerHeight,
			images = [ searchBg, resultImage ];

		images.forEach(function(image) {
			if(image !== null) {
				fitImage(image, w, h);
			}
		});

	}

	function fitImage(image, w, h) {
		var imageStyle = image.style,
			imageWidth = image.naturalWidth,
			imageHeight = image.naturalHeight;

		if(imageWidth === 0 || imageHeight === 0) {
			return;
		}

		var tmpW = w,
			tmpH = w * imageHeight / imageWidth;

		if(tmpH < h) {
			tmpH = h;
			tmpW = h * imageWidth / imageHeight;
		}

		imageStyle.width = tmpW + 'px';
		imageStyle.height = tmpH + 'px';

		imageStyle.left = (Math.floor(w - tmpW) / 2) + 'px';
		imageStyle.top = (Math.floor(h - tmpH) / 2) + 'px';

	}

	function preloadImage(url) {
		var img = document.createElement('img');
		img.addEventListener('load', removeImage, false);
		img.addEventListener('error', removeImage, false);
		img.style.display = 'none';
		document.body.appendChild(img);
		img.src = url;

		function removeImage() {
			img.parentNode.removeChild(img);
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
