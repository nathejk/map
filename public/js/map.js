var errorElement = document.getElementById("error");
var popupElement = document.getElementById("popup");
var popupCloserElement = document.getElementById("popup-closer");
var popupContentElement = document.getElementById("popup-content");

var view = new ol.View({
    center: ol.proj.transform([12.5212158, 55.6809077], "EPSG:4326", "EPSG:3857"),
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

    // var element = popup.getElement();
    var coordinate = evt.coordinate;
    // var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326"));

    var pixel = map.getEventPixel(evt.originalEvent);
    var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });

    if(feature == null) {
        var html = "<p>Create Playground</p>";

        html += '<p>Name: <input class="input" id="name" type="text" value=""></p>';

        var lonlat = ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326");
        html += '<p>Latitude:  <input class="input" id="latitude" type="number" value="' + lonlat[1].toFixed(4) + '"></p>';
        html += '<p>Longitude: <input class="input" id="longitude" type="number" value="' + lonlat[0].toFixed(4) + '"></p>';
        html += '<p><input id="create_playground" type="button" value="Create"></p>';

        popupContentElement.innerHTML = html;

        document.getElementById("create_playground").onclick = function() {
            var data = {
                name: document.getElementById("name").value,
                latitude: document.getElementById("latitude").value,
                longitude: document.getElementById("longitude").value
            };

            // $.ajax({
            //     method: "POST",
            //     data: data,
            //     url: base_url + "/playgrounds",
            //     timeout: 4000,
            //     success: function(data) {
            //
            //     },
            //     error: function(data, exception) {
            //         alert("Could not create playground on server!");
            //     }
            // });
            popup.setPosition(undefined);
        };

        popup.setPosition(coordinate);
        return;
    }
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

function updateSearch() {
    console.log("update search")
    // $.ajax({
    //     type: "GET",
    //     url: base_url + "/playgrounds",
    //     timeout: 3000,
    //     dataType: "json",
    //     success: function(data) {
    //         eventSource.clear();
    //
    //         for(var index in data.playgrounds) {
    //             var playground = data.playgrounds[index];
    //             var geom = new ol.geom.Circle(ol.proj.transform([playground.location.lon, playground.location.lat], "EPSG:4326", "EPSG:3857"), 200);
    //
    //             var feature = new ol.Feature({ geometry: geom });
    //
    //             feature.type = "playground";
    //             feature.data = playground;
    //             eventSource.addFeature(feature);
    //         }
    //         errorElement.style.display = "none";
    //     },
    //     error: function(data, exception) {
    //         errorElement.innerHTML = "Connection issues";
    //         errorElement.style.display = "block";
    //     }
    // });
}

function update() {
    updateSearch();
}

initLayers(function() {
    update();
    window.setInterval(update, 1000);
});
