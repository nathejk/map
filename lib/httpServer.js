var _ = require("lodash");
var async = require("async");
var express = require("express");
var bodyParser = require("body-parser");
var mustacheExpress = require("mustache-express");
var elasticsearch = require("es");

var config = require("config");

module.exports = function httpServer() {
    var app = express();
    var es = elasticsearch(config.elasticsearch);

    app.engine("mustache", mustacheExpress());
    app.set("view engine", "mustache");
    app.set("views", __dirname + "/views");

    app.use(express.static("public"));
    app.use(bodyParser.json());

    app.get("/", (req, res) => {
        res.render("index");
    });

    app.post("/apiv1/search", (req, res) => {
        console.log(JSON.stringify(req.body));
        var query = req.body || { match_all: { } };

        es.search({
            search_type: "scan",
            scroll: "30s"
        }, {
            query: query
        }, function(error, data) {
            if(error) {
                console.log(error);
                return res.sendStatus(500);
            }
            var scrollId = data["_scroll_id"];
            var numberOfHits = data.hits.total;
            var hits = [];
            async.doUntil((callback) => {
                es.scroll({ scroll: "30s" }, scrollId, (error, data) => {
                    if(error) {
                        return callback(error);
                    }

                    hits = hits.concat(data.hits.hits);
                    callback();
                });
            }, () => {
                return hits.length === numberOfHits;
            }, (error) => {
                if(error) {
                    console.log(error);
                    return res.sendStatus(500);
                }
                // console.log(_.map(hits, "_source"));
                return res.status(200).send(_.map(hits, "_source"));
            })
        });

    });

    app.listen(config.port, () => {
        console.log("Listening on port " + config.port);
    });
};
