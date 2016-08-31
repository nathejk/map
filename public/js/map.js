var errorElement = document.getElementById("error");
var popupElement = document.getElementById("popup");
var popupCloserElement = document.getElementById("popup-closer");
var popupContentElement = document.getElementById("popup-content");

var query = {};

var view = new ol.View({
    center: ol.proj.transform([12.0777615 , 55.6499431], "EPSG:4326", "EPSG:3857"),
    zoom: 12 });

// init map
var map = new ol.Map({
    layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
    target: "map",
    view: view,
    loadTilesWhileAnimating: true
});

// init popup
var popup = new ol.Overlay({ element: popupElement });
map.addOverlay(popup);

popupCloserElement.onclick = function() { popup.setPosition(undefined); };


// init sources
var eventSource = new ol.source.Vector();

var initLayers = function(callback) {
    var eventLayer = new ol.layer.Vector({
        source: eventSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({ color: "black", width: 1 }),
            fill: new ol.style.Fill({ color: "black" })
        }),
        opacity: 0.6
    });

    map.addLayer(eventLayer);

    callback();
};


map.on("click", function(evt) {
    if(popup.getPosition()) {
        popup.setPosition(undefined);
        return;
    }

    var coordinate = evt.coordinate;

    var pixel = map.getEventPixel(evt.originalEvent);
    var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });


});

function flyTo(coords) {
    var duration = 2000;
    var start = +new Date();
    var pan = ol.animation.pan({
        duration: duration,
        source: /** @type {ol.Coordinate} */ (view.getCenter()),
        start: start
    });
    var bounce = ol.animation.bounce({
        duration: duration,
        resolution: 4 * view.getResolution(),
        start: start
    });
    var zoom = ol.animation.zoom({
        duration: duration,
        resolution: view.getResolution(),
        start: start
    });
    map.beforeRender(pan, bounce, zoom);
    view.setCenter(ol.proj.fromLonLat(coords));
    view.setZoom(16);
}

function reSearch() {
    $.ajax({
        type: "POST",
        url: "/apiv1/search",
        timeout: 3000,
        dataType: "json",
        data: JSON.stringify(query),
        contentType: "application/json; charset=utf-8",
        success: function(events) {
            // console.log("Got data: " + JSON.stringify(events));
            eventSource.clear();

            for(var index in events) {
                var event = events[index];
                var geom = new ol.geom.Circle(ol.proj.transform([event.location.lon, event.location.lat], "EPSG:4326", "EPSG:3857"), 20);

                var feature = new ol.Feature({ geometry: geom });

                feature.type = event.type;
                feature.data = event;
                eventSource.addFeature(feature);
            }

            errorElement.style.display = "none";
        },
        error: function(data, exception) {
            errorElement.innerHTML = "Connection issues";
            errorElement.style.display = "block";
        }
    });
}

function update() {
    reSearch();
}


var values = ["patrol", "type", "charter", "gang", "bandit", "team", "checkPoint"];
function updateSearchQuery() {
    var musts = [];

    for (var i in values) {
        var valueName = values[i];
        var value = document.getElementById(valueName).value;
        if(value) {
            var must = { match: { } };
            must.match[valueName] = value;
            musts.push(must);
        }
    }

    query = {
        bool: {
            must: musts
        }
    }

    update();
}

function clearSearchQuery() {
    for (var i in values) {
        var valueName = values[i];
        document.getElementById(valueName).value = "";
    }
    query = {};
    update();
}


var adjustSearchElement = document.getElementById("adjustSearch");
adjustSearchElement.onclick = updateSearchQuery;

var clearSearchElement = document.getElementById("clearSearch");
clearSearchElement.onclick = clearSearchQuery;

initLayers(function() {
    update();
    window.setInterval(update, 5000);
});
