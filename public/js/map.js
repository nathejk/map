var errorElement = document.getElementById("error");
var popupElement = document.getElementById("popup");
var popupCloserElement = document.getElementById("popup-closer");
var popupContentElement = document.getElementById("popup-content");

var query = undefined;

var view = new ol.View({
    center: ol.proj.transform([12.0777615 , 55.6499431], "EPSG:4326", "EPSG:3857"),
    projection: ol.proj.get('EPSG:3857'),
    zoom: 12
});

var vector = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: '/data/nathejk.kmz',
      format: new ol.format.KML()
    })
});


// init map
var map = new ol.Map({
    layers: [new ol.layer.Tile({ source: new ol.source.OSM() }), vector],
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
            stroke: new ol.style.Stroke({ color: "black", width: 2 }),
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

    if(!feature) {
        return;
    }

    var date = (new Date(feature.data.timestamp)).toLocaleString("da-DK");
    var string = "<p>" + date + "</p>";

    if(feature.type === "caught") {
        string += "<p>Patrol [" + feature.data.patrol + "] caught by bandit [" + feature.data.bandit + "]</p>";
        popupContentElement.innerHTML = string;
    }

    if(feature.type === "checkIn") {
        string += "<p>Patrol [" + feature.data.patrol + "] checked in at [" + feature.data.checkPoint + "]</p>";
        popupContentElement.innerHTML = string;
    }

    if(feature.type === "contact") {
        string += "<p>Patrol [" + feature.data.patrol + "] had contact with team [" + feature.data.team + "]</p>";
    }

    popupContentElement.innerHTML = string;
    popup.setPosition(coordinate);
});

function flyTo(coords) {
    var duration = 1000;
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
    view.setZoom(17);
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
            eventSource.clear();

            var drawResults = true;
            if(events.length > 200) {
                drawResults = false;
                resultsContent.innerHTML = "Too many results to list, try to narrow it down.";
            }

            var results = "";
            for(var index in events) {
                var event = events[index];
                var geom = new ol.geom.Circle(ol.proj.transform([event.location.lon, event.location.lat], "EPSG:4326", "EPSG:3857"), 20);

                var feature = new ol.Feature({ geometry: geom });

                var eventColours = {
                    checkIn: "#00FF00",
                    contact: "#0000FF",
                    caught: "#FF0000"
                }

                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: "black", width: 1 }),
                    fill: new ol.style.Fill({ color: eventColours[event.type] }),
                });

                feature.setStyle(style);

                feature.type = event.type;
                feature.data = event;
                eventSource.addFeature(feature);


                if(drawResults) {
                    var html = "<p onclick=\"flyTo([" + event.location.lon + ", "+ event.location.lat + "])\">";

                    if(event.type === "caught") {
                        html += "Patrol [" + event.patrol + "] caught by bandit [" + event.bandit + "]</p>";
                    }

                    if(event.type === "checkIn") {
                        html += "Patrol [" + event.patrol + "] checked in at [" + event.checkPoint + "]</p>";
                    }

                    if(event.type === "contact") {
                        html += "Patrol [" + event.patrol + "] had contact with team [" + event.team + "]</p>";
                    }

                    results += html;
                }
            }

            if(drawResults) {
                resultsContent.innerHTML = results;
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
var dates = ["from", "to"];
function updateSearchQuery() {
    var fields = { };

    var d = new Date()
    var offset = d.getTimezoneOffset();

    for (var i in values) {
        var valueName = values[i];
        var value = document.getElementById(valueName).value || undefined;
        if(value !== undefined) {
            fields[valueName] = value;
        }
    }

    for (var i in dates) {
        var valueName = dates[i];
        var value = document.getElementById(valueName).value || undefined;
        if(value !== undefined) {
            fields[valueName] = new Date(Date.parse(value)+ offset * 60 * 1000).toISOString();
        }
    }

    query = fields;

    update();
}

function clearSearchQuery() {
    for (var i in values) {
        var valueName = values[i];
        document.getElementById(valueName).value = "";
    }
    for (var i in dates) {
        var valueName = dates[i];
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
    startTime()
});

function startTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('time').innerHTML =
    h + ":" + m + ":" + s;
    var t = setTimeout(startTime, 1000);
}
function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}
