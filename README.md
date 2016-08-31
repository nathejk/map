nathejk/map
===========
This purpose of this project is to visualize data gathered during **Nathejk**.


## How it works
Events are received from NATS. The events are put into an ElasticSearch instance. From ElasticSearch, the events can be queried from either Kibana, using the Lucene-syntax, or from the Nathejk map itself.


## How to run it
First, build the docker image of **nathejk/map**. Then run a NATS-container and an ELK-container. Finally, start the **nathejk/map**-container.

```
$ docker build . --tag nathejk/map

$ docker run -d -p 4222:4222 -p 8222:8222 --name nats nats
$ docker run -d -p 5601:5601 -p 9200:9200 -e LOGSTASH_START=0 --name elk sebp/elk
$ docker run -d -p 3000:9080 --link nats:nats --link elk:elk --name map nathejk/map
```


## Events

There are 3 kinds of events that are being processed.

### Check-ins
``` javascript
{
    type: "checkIn",
    patrol: {patrolNumber},
    checkPoint: {checkPointId},
    timestamp: {iso8601}
}
```

### Contacts
``` javascript
{
    type: "contact",
    patrol: {patrolNumber},
    team: {teamNumber},
    timestamp: {iso8601}
}
```

### Catches
``` javascript
{
    type: "caught",
    patrol: {patrolNumber},
    bandit: {banditNumber},
    charter: {charterNumber},
    gang: {gangNumber},
    timestamp: {iso8601}
}
```


### Notes
To add better map and mapzoom to kibana tilemap visualization, add the following to `kibana.yml`:

    tilemap.url: "http://irs.gis-lab.info/?layers=osm&request=GetTile&z={z}&x={x}&y={y}"
    tilemap.options.attribution: "GIS-LAB.info tWMS service"
    tilemap.options.maxZoom: 18


On the ELK docker image [*sebp/elk*](https://hub.docker.com/r/sebp/elk/), `kibana.yml` is located in `/opt/kibana/config`.
