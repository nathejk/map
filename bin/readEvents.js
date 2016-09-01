var _ = require("lodash");
var nats = require("nats");
var config = require("config");

var events = require("../data/eventsNathejk2015.json");

_.forEach(events, sendEvent);

function sendEvent(event) {
    var queue = nats.connect(config.nats.server);
    queue.publish(config.nats.queue, JSON.stringify(event), () => {
        console.log("Sent event");
        queue.close();
    });
}
