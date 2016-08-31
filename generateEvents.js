var _ = require("lodash");
var nats = require("nats");
var config = require("config");

var numberOfEvents = process.argv[2] || 100;
_.times(numberOfEvents, sendRandomEvent);

function sendRandomEvent() {
    var queue = nats.connect(config.nats.server);
    queue.publish(config.nats.queue, JSON.stringify(randomEvent()), () => {
        console.log("Sent event");
        queue.close();
    });
}

function randomEvent() {
    var choice = randomInt(1, 10);
    if(choice === 1) {
        return randomContactEvent();
    }
    if(choice === 2) {
        return randomCheckInEvent();
    }
    return randomCaughtEvent();
}

function randomContactEvent() {
    var location = randomLocation();

    var contactEvent = { type: "contact", location: location, timestamp: (new Date().toISOString()) };
    contactEvent.patrol = randomPatrol();
    contactEvent.team = randomTeam();

    return contactEvent;
}

function randomTeam() {
    return randomInt(1, 20) + "";
}

function randomCheckInEvent() {
    var location = randomLocation();

    var checkInEvent = { type: "checkIn", location: location, timestamp: (new Date().toISOString()) };
    checkInEvent.patrol = randomPatrol();
    checkInEvent.checkPoint = randomCheckPoint();

    return checkInEvent;
}

function randomCheckPoint() {
    var checkPointLetters = "ABC";
    var checkPoint = checkPointLetters.charAt(Math.floor(Math.random() * checkPointLetters.length));

    return checkPoint + randomInt(1, 3);
}

function randomCaughtEvent() {
    var location = randomLocation();

    var caughtEvent = { type: "caught", location: location, timestamp: (new Date().toISOString()) };
    caughtEvent.patrol = randomPatrol();
    caughtEvent.charter = randomCharter();
    caughtEvent.bandit = randomBanditInCharter(caughtEvent.charter);
    caughtEvent.gang = estimateGang(caughtEvent.bandit);

    return caughtEvent;
}

function randomLocation() {
    return { lat: config.testLocation.lat + (Math.random() - 0.5) * 0.1, lon: config.testLocation.lon + (Math.random() - 0.5) * 0.1 };
}

function randomPatrol() {
    return randomInt(1, 150) + "";
}

function randomCharter() {
    return randomInt(1, 5) + "";
}

function randomBanditInCharter(charter) {
    var bandit = randomInt(1, 30) + "";
    if(bandit < 10) {
        bandit = "0" + bandit;
    }
    return charter + bandit;
}

function estimateGang(bandit) {
    return Math.floor(bandit.substr(1) / 4);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}
