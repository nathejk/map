var nats = require("nats");

var config = require("config");



var location = { lat: 55.6499431 + (Math.random() - 0.5) * 0.2, lon: 12.0777615 + (Math.random() - 0.5) * 0.2 };

var event = {
    message: "Hello world!",
    location: location
};

var queue = nats.connect(config.nats.server);
queue.publish(config.nats.queue, JSON.stringify(event), () => {
    queue.close();
});
