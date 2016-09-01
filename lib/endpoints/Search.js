var _ = require("lodash");
var async = require("async");

module.exports = function(elasticsearch) {
    return search.bind(null, elasticsearch);
};

function search(es, req, res) {
    // console.log(JSON.stringify(req.body));

    var query = req.body || { match_all: { } };
    if(_.isEmpty(req.body)) {
        query = { match_all: { } };
    }

    else {
        var musts = ["patrol", "type", "charter", "gang", "bandit", "team", "checkPoint"];
        var greaterThan = "from";
        var lessThan = "to";

        query = { bool: { must: [], filter: [] } };

        _.forEach(musts, (value) => {
            if(req.body[value]) {
                var match = { match: {  } };
                match.match[value] = req.body[value];
                query.bool.must.push(match);
            }
        });

        if(req.body[greaterThan]) {
            query.bool.filter.push({ range: { timestamp: { gte: req.body[greaterThan] } } });
        }
        if(req.body[lessThan]) {
            query.bool.filter.push({ range: { timestamp: { lte: req.body[lessThan] } } });
        }

        // console.log(JSON.stringify(query));
    }

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

            hits = _.map(hits, "_source");
            hits = _.reverse(_.sortBy(hits, "timestamp"));
            // console.log(hits);
            return res.status(200).send(hits);
        });
    });
}
