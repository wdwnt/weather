var express = require('express');
var app = express();
var os = require("os");
const redis = require("redis");
const fetch = require("node-fetch");

var hostname = os.hostname();

const weatherApiKey = process.env.WEATHER_API_KEY || '';

var port = process.env.PORT || 3000;

var host = process.env.REDIS_URL || '127.0.0.1';
let redis_client = redis.createClient(host);

const weather_time_to_live = 600;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/api/wdw", (req, resp) => {
    var request = {
        lat: 28.4160036778,
        lon: -81.5811902834,
        key: 'wdw'
    };

    getWeatherInformation(request, resp);
    return;
});

app.get("/api/dlr", (req, resp) => {
    var request = {
        lat: 33.8095545068,
        lon: -117.9189529669,
        key: 'dlr'
    };

    getWeatherInformation(request, resp);
    return;
});

app.get("/api/tdr", (req, resp) => {
    var request = {
        lat: 35.6329,
        lon: 139.8804,
        key: 'tdr'
    };

    getWeatherInformation(request, resp);
    return;
});

app.get("/api/dlp", (req, resp) => {
    var request = {
        lat: 48.870205,
        lon: 2.779913,
        key: 'dlp'
    };

    getWeatherInformation(request, resp);
    return;
});

app.get("/api/hkdl", (req, resp) => {
    var request = {
        lat: 22.313131,
        lon: 114.044517,
        key: 'hkdl'
    };

    getWeatherInformation(request, resp);
    return;
});

app.get("/api/shdr", (req, resp) => {
    var request = {
        lat: 31.147097966725,
        lon: 121.66901898194,
        key: 'shdr'
    };

    getWeatherInformation(request, resp);
    return;
});

function getWeatherInformation(req, resp) {
    redis_client.get(req.key, (err, result) => {
        if (result != null) {
            resp.json(JSON.parse(result));
        } else {
            fetch(
                'https://api.darksky.net/forecast/' +
                    weatherApiKey +
                    '/' +
                    req.lat +
                    ',' +
                    req.lon
            )
            .then(res => res.json())
            .then(json => {
                redis_client.setex(req.key, weather_time_to_live, JSON.stringify(json));
                resp.json(json);
            })
            .catch(err => {
                console.error(err);
                resp.send(202);
            });
        }
    });
}

app.listen(port);
console.log(hostname + ": App listening on port " + port);
