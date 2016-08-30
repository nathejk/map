var express = require("express");
var mustacheExpress = require("mustache-express");

var config = require("config");

module.exports = function httpServer() {
    var app = express();

    app.engine("mustache", mustacheExpress());
    app.set("view engine", "mustache");
    app.set("views", __dirname + "/views");

    app.use(express.static("public"));

    app.get("/", (req, res) => {
        res.render("index", { title: "Nathejk Map", name: "Asbjørn" });
    });

    app.listen(config.port, () => {
        console.log("Listening on port " + config.port);
    });
};
