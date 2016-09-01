var express = require("express");
var bodyParser = require("body-parser");
var mustacheExpress = require("mustache-express");
var elasticsearch = require("es");

var config = require("config");

var SearchEndpoint = require("./endpoints/Search.js");
var KmzUpload = require("./endpoints/KmzUpload.js");

module.exports = function httpServer() {
    var app = express();
    var es = elasticsearch(config.elasticsearch);

    app.engine("mustache", mustacheExpress());
    app.set("view engine", "mustache");
    app.set("views", __dirname + "/views");

    app.use(express.static("public"));
    app.use(bodyParser.json());

    app.get("/", (req, res) => res.render("index"));
    app.post("/apiv1/kmzUpload", new KmzUpload());
    app.post("/apiv1/search", new SearchEndpoint(es));

    app.listen(config.port, () => {
        console.log("Listening on port " + config.port);
    });
};
