var async = require("async");
var nats = require("nats");
var elasticsearch = require("es");
var config = require("config");

module.exports = function locationListener() {
    var queue = nats.connect(config.nats.server);
    var es = elasticsearch(config.elasticsearch);

    ensureIndex(es, (error) => {
        if(error) {
            throw error;
        }
        queue.subscribe(config.nats.queue, function(event) {
            event = JSON.parse(event);

            if(!event.timestamp) {
                event.timestamp = (new Date()).toISOString();
            }

            async.retry({ times: 60, interval: 1000 }, (callback) => {
                es.index(event, callback);
            }, (error) => {
                if(error) {
                    return console.log("Could not put event into ElasticSearch", event, error);
                    // throw error;
                }
                console.log("Inserted event into ElasticSearch");
            });
        });
    });
};


function ensureIndex(es, callback) {
    es.indices.exists((error, existingIndex) => {
        if(error) {
            return callback(error);
        }

        if(existingIndex.exists) {
            console.log("Index already exists");
            return callback();
        }

        var esType = config.elasticsearch._type;
        var index = { mappings: { } };
        index.mappings[esType] = { properties: { location: { type: "geo_point" } } };

        es.indices.createIndex(index, (error, result) => {
            if(error) {
                return callback(error);
            }

            if(result.acknowledged) {
                console.log("Index created");
                return callback();
            }

            callback(new Error("Something wierd happened", result));
        });
    });
}
