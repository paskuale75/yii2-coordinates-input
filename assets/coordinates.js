if (typeof alexantr === 'undefined' || !alexantr) {
    var alexantr = {};
}

alexantr.coordinatesWidget = (function (d) {
    'use strict';

    var yandexMapsApiLoading = false,
        googleMapsApiLoading = false,
        yandexMapsCallbacks = [],
        googleMapsCallbacks = [];

    function initOptions(inputId, options) {
        var inputValue = d.getElementById(inputId).value;
        var lat = 0, lng = 0, zoom = 1, showMarker = false;
        // check input value
        if (inputValue) {
            var inputLatLng = inputValue.split(/\s*,\s*/);
            if (inputLatLng.length === 2) {
                lat = parseFloat(inputLatLng[0]) || 0;
                lng = parseFloat(inputLatLng[1]) || 0;
                showMarker = true;
                zoom = 14;
            }
        }
        // no input value
        if (!showMarker) {
            if ('lat' in options && 'lng' in options) {
                lat = options.lat;
                lng = options.lng;
                zoom = ('zoom' in options) ? options.zoom : 10;
            }
        }
        return {
            lat: lat,
            lng: lng,
            zoom: zoom,
            showMarker: showMarker
        };
    }

    function changeInputValue(input, lat, lng) {
        input.value = lat.toFixed(6) + ', ' + lng.toFixed(6);
        input.setAttribute('data-changed', '1'); // prevent change event
        if ('createEvent' in d) {
            var evt = d.createEvent('HTMLEvents');
            evt.initEvent('change', false, true);
            input.dispatchEvent(evt);
        } else {
            input.fireEvent('onchange');
        }
    }

    function runYandexMaps(inputId, mapId, options) {
        var input = d.getElementById(inputId),
            opt = initOptions(inputId, options),
            placemarkPreset = 'islands#redDotIcon';
        var yMap = new ymaps.Map(mapId, {
            center: [opt.lat, opt.lng],
            zoom: opt.zoom,
            controls: ['zoomControl']
        });
        var marker;
        if (opt.showMarker) {
            marker = new ymaps.Placemark([opt.lat, opt.lng], {}, {preset: placemarkPreset});
            yMap.geoObjects.add(marker);
        }
        yMap.events.add('click', function (e) {
            var coords = e.get('coords');
            if (typeof marker !== 'undefined') {
                yMap.geoObjects.remove(marker);
            }
            marker = new ymaps.Placemark(coords, {}, {preset: placemarkPreset});
            yMap.geoObjects.add(marker);
            changeInputValue(input, coords[0], coords[1]);
        });
        input.onchange = function () {
            if (input.getAttribute('data-changed')) {
                input.removeAttribute('data-changed');
            } else if (input.value) {
                var inputLatLng = input.value.split(/\s*,\s*/);
                if (inputLatLng.length === 2) {
                    var lat = parseFloat(inputLatLng[0]) || 0;
                    var lng = parseFloat(inputLatLng[1]) || 0;
                    yMap.setCenter([lat, lng], 14);
                    if (typeof marker !== 'undefined') {
                        yMap.geoObjects.remove(marker);
                    }
                    marker = new ymaps.Placemark([lat, lng], {}, {preset: placemarkPreset});
                    yMap.geoObjects.add(marker);
                }
            }
        };

        // Creating an instance of the ymaps.control.SearchControl class.
        var mySearchControl = new ymaps.control.SearchControl({
                options: {
                    noPlacemark: true,
                }
            }),

            // The search results will be placed in the collection.
            mySearchResults = new ymaps.GeoObjectCollection(null, {
                hintContentLayout: ymaps.templateLayoutFactory.createClass('$[properties.name]')
            });
        console.log('mySearchResults qui sotto :');
        console.dir(mySearchResults);
        yMap.controls.add(mySearchControl);
        yMap.geoObjects.add(mySearchResults);

        // Subscribing to the event of getting search results from the server.
        mySearchControl.events.add('resultselect', function (e) {
            var index = mySearchControl.getSelectedIndex(e);
            console.log("Index of the selected element: " + index);

            var result = mySearchControl.getResult();
            result.then(function (res) {
                console.log("Results " + res );
            }, function (err) {
                console.log("Error");
            });

        });



        mySearchControl.events.add('load', function (event) {
            // Checking that this event isn't just finishing loading results
            // and the query has at least one result found.
            if (!event.get('skip') && mySearchControl.getResultsCount()) {
                mySearchControl.showResult(0);
                console.log('mySearchControl.showResult(0) = ');
                console.log('seguimi sono qui !!!!');
                console.dir(mySearchControl.showResult(0));
                e.get('target').options.set('preset', 'islands#redIcon');
                console.log(' chi è sto e.get(target) ?');
                console.dir(e.get('target'));

                var coords = e.get('coords');
                console.log('events.add click --> coords:');
                console.dir(coords);
                if (typeof marker !== 'undefined') {
                    yMap.geoObjects.remove(marker);
                }
                marker = new ymaps.Placemark(coords, {}, {preset: placemarkPreset});
                yMap.geoObjects.add(marker);
                changeInputValue(input, coords[0], coords[1]);
            }
        });
        // When the found object is clicked, the placemark turns red.
        /*mySearchResults.events.add('click', function (e) {
            e.get('target').options.set('preset', 'islands#redIcon');
            console.log('e.get(\'target\'):');
            console.dir(e.get('target'));

            var coords = e.get('coords');
            console.log('events.add click --> coords:');
            console.dir(coords);
            if (typeof marker !== 'undefined') {
                yMap.geoObjects.remove(marker);
            }
            marker = new ymaps.Placemark(coords, {}, {preset: placemarkPreset});
            yMap.geoObjects.add(marker);
            changeInputValue(input, coords[0], coords[1]);
        });*/
        // Putting the selected result in the collection.
        mySearchControl.events.add('resultselect', function (e) {
            var index = e.get('index');
            mySearchControl.getResult(index).then(function (res) {
                mySearchResults.add(res);
            });
            console.log('events > add > resultselect ');
            console.log('res = '+res);
            console.log('index = '+index);
        }).add('submit', function () {
            mySearchResults.removeAll();
        });

        // workaround for blank map in some cases
        setTimeout(function () {
            yMap.container.fitToViewport();
        }, 200);
    }

    function runGoogleMaps(inputId, mapId, options) {
        var input = d.getElementById(inputId),
            map = d.getElementById(mapId),
            opt = initOptions(inputId, options);
        var latlng = new google.maps.LatLng(opt.lat, opt.lng);
        var gMap = new google.maps.Map(map, {
            zoom: opt.zoom,
            center: latlng
        });
        var marker;
        if (opt.showMarker) {
            marker = new google.maps.Marker({position: latlng, map: gMap});
        }
        google.maps.event.addListener(gMap, 'click', function (e) {
            if (typeof marker !== 'undefined') {
                marker.setMap(null);
            }
            marker = new google.maps.Marker({position: e.latLng, map: gMap});
            changeInputValue(input, e.latLng.lat(), e.latLng.lng());
        });
        input.onchange = function () {
            if (input.getAttribute('data-changed')) {
                input.removeAttribute('data-changed');
            } else if (input.value) {
                var inputLatLng = input.value.split(/\s*,\s*/);
                if (inputLatLng.length === 2) {
                    var lat = parseFloat(inputLatLng[0]) || 0;
                    var lng = parseFloat(inputLatLng[1]) || 0;
                    var latlng = new google.maps.LatLng(lat, lng);
                    gMap.panTo(latlng);
                    gMap.setZoom(14);
                    if (typeof marker !== 'undefined') {
                        marker.setMap(null);
                    }
                    marker = new google.maps.Marker({position: latlng, map: gMap});
                }
            }
        };

        // workaround for blank map in some cases
        setTimeout(function () {
            google.maps.event.trigger(gMap, 'resize');
        }, 200);
    }

    return {
        yandexMapsApiCallback: function () {
            yandexMapsApiLoading = false;
            for (var i = 0; i < yandexMapsCallbacks.length; i++) {
                runYandexMaps(yandexMapsCallbacks[i].inputId, yandexMapsCallbacks[i].mapId, yandexMapsCallbacks[i].options);
            }
        },
        googleMapsApiCallback: function () {
            googleMapsApiLoading = false;
            for (var i = 0; i < googleMapsCallbacks.length; i++) {
                runGoogleMaps(googleMapsCallbacks[i].inputId, googleMapsCallbacks[i].mapId, googleMapsCallbacks[i].options);
            }
        },
        initYandexMaps: function (inputId, mapId, options, lang) {
            if (typeof ymaps !== 'undefined') {
                runYandexMaps(inputId, mapId, options);
            } else {
                yandexMapsCallbacks.push({inputId: inputId, mapId: mapId, options: options});
                if (!yandexMapsApiLoading) {
                    yandexMapsApiLoading = true;
                    var script = d.createElement('script');
                    script.type = 'text/javascript';
                    script.src = 'https://api-maps.yandex.ru/2.1/?lang=' + lang + '&onload=alexantr.coordinatesWidget.yandexMapsApiCallback';
                    script.async = true;
                    var scriptTag = d.getElementsByTagName('script')[0];
                    scriptTag.parentNode.insertBefore(script, scriptTag);
                }
            }
        },
        initGoogleMaps: function (inputId, mapId, options, apiKey) {
            if (typeof google === 'object' && typeof google.maps === 'object') {
                runGoogleMaps(inputId, mapId, options);
            } else {
                googleMapsCallbacks.push({inputId: inputId, mapId: mapId, options: options});
                if (!googleMapsApiLoading) {
                    googleMapsApiLoading = true;
                    var script = d.createElement('script');
                    script.type = 'text/javascript';
                    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&callback=alexantr.coordinatesWidget.googleMapsApiCallback';
                    script.async = true;
                    var scriptTag = d.getElementsByTagName('script')[0];
                    scriptTag.parentNode.insertBefore(script, scriptTag);
                }
            }
        }
    };
})(document);
