var express = require('express');
var app = express();
var os = require("os");
const redis = require("async-redis");
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

app.get("/api/wdw", async (req, resp) => {
    var result = await getWeatherInformation(28.4160036778, -81.5811902834, 'wdw');
    resp.json(result);
});

app.get("/api/dlr", async (req, resp) => {
    var result = await getWeatherInformation(33.8095545068, -117.9189529669, 'dlr');
    resp.json(result);
});

app.get("/api/tdr", async (req, resp) => {
    var result = await getWeatherInformation(35.6329, 139.8804, 'tdr');
    resp.json(result);
});

app.get("/api/dlp", async (req, resp) => {
    var result = await getWeatherInformation(48.870205, 2.779913, 'dlp');
    resp.json(result);
});

app.get("/api/hkdl", async (req, resp) => {
    var result = await getWeatherInformation(22.313131, 114.044517, 'hkdl');
    resp.json(result);
});

app.get("/api/shdr", async (req, resp) => {
    var result = await getWeatherInformation(31.147097966725, 121.66901898194, 'shdr');
    resp.json(result);
});

async function getWeatherInformation(lat, lon, key) {
    let redis_data = await redis_client.get(key);

    if (redis_data === null) {
        let darkSkyDataRequest = await fetch(
            'https://api.darksky.net/forecast/' +
                weatherApiKey +
                '/' +
                lat +
                ',' +
                lon +
                '?exclude=minutely,hourly,alerts,flags'
        );

        let responseJson = await darkSkyDataRequest.json();
        await redis_client.setex(key, weather_time_to_live, JSON.stringify(responseJson));
        return responseJson;
    } else {
        return JSON.parse(redis_data);
    }
}

app.listen(port);
console.log(hostname + ": App listening on port " + port);
