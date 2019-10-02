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

app.get("/api/all", async (req, resp) => {
    const [wdw, dlr, tdr, dlp, hkdl, shdr] = await Promise.all([
        getWDWWeatherInformation(),
        getDLRWeatherInformation(),
        getTDRWeatherInformation(),
        getDLPWeatherInformation(),
        getHKDLWeatherInformation(),
        getSHDRWeatherInformation()
    ]);

    return resp.json({
        'wdw': wdw,
        'dlr': dlr,
        'tdr': tdr,
        'dlp': dlp,
        'hkdl': hkdl,
        'shdr': shdr,
    });
});

app.get("/api/:destination", async (req, resp) => {
    var destination = req.params.destination;
    var destinationWeather = await getWeatherForDestination(destination);

    resp.json(destinationWeather.weather);
});

app.get("/api/speech/:destination", async (req, resp) => {
    var destination = req.params.destination;

    var destinationWeather = await getWeatherForDestination(destination);
    var weather = destinationWeather.weather;
    var destinationName = destinationWeather.destinationName;

    var currentlySummary = weather.currently.summary.toLowerCase();
    var currentlyTempF = Math.round(weather.currently.temperature);
    var currentlyTempC = convertFahrenheitToCelsius(currentlyTempF);
    var currentConditions = `The weather at ${destinationName} is ${currentlySummary} and ${currentlyTempF} degrees Fahrenheit or ${currentlyTempC} degrees Celsius.`;
    var currentConditionsDisplay = `The weather at ${destinationName} is ${currentlySummary} and ${currentlyTempF}°F (${currentlyTempC}°C).`;

    var todaysForecast = formatForecastForSpeech(weather.daily.data[0], 'today');
    var tomorrowsForecast = formatForecastForSpeech(weather.daily.data[1], 'tomorrow');

    var speech = `${currentConditions} ${todaysForecast.speech} ${tomorrowsForecast.speech}`;
    var displayText = `${currentConditionsDisplay} ${todaysForecast.displayText} ${tomorrowsForecast.displayText}`;

    resp.json({ speech, displayText });
});

async function getWeatherForDestination(destination) {
    var weather = {};
    var destinationName = 'Walt Disney World';

    switch (destination) {
        case 'wdw':
            weather = await getWDWWeatherInformation();
            destinationName = 'Walt Disney World';
            break;
        case 'dlr':
            weather = await getDLRWeatherInformation();
            destinationName = 'Disneyland Resort';
            break;
        case 'tdr':
            weather = await getTDRWeatherInformation();
            destinationName = 'Tokyo Disney Resort';
            break;
        case 'dlp':
            weather = await getDLPWeatherInformation();
            destinationName = 'Disneyland Paris';
            break;
        case 'hkdl':
            weather = await getHKDLWeatherInformation();
            destinationName = 'Hong Kong Disneyland Resort';
            break;
        case 'shdr':
            weather = await getSHDRWeatherInformation();
            destinationName = 'Shanghai Disney Resort';
            break;
        default:
            weather = await getWDWWeatherInformation();
            destinationName = 'Walt Disney World';
            break;
    }

    return {
        weather,
        destinationName
    }
}

async function getWDWWeatherInformation() {
    return await getWeatherInformation(28.4160036778, -81.5811902834, 'wdw');
}

async function getDLRWeatherInformation() {
    return await getWeatherInformation(33.8095545068, -117.9189529669, 'dlr');
}

async function getTDRWeatherInformation() {
    return await getWeatherInformation(35.6329, 139.8804, 'tdr');
}

async function getDLPWeatherInformation() {
    return await getWeatherInformation(48.870205, 2.779913, 'dlp');
}

async function getHKDLWeatherInformation() {
    return await getWeatherInformation(22.313131, 114.044517, 'hkdl');
}

async function getSHDRWeatherInformation() {
    return await getWeatherInformation(31.147097966725, 121.66901898194, 'shdr');
}

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

function formatForecastForSpeech(forecast, dayDisplayText) {
    var forecastText = forecast.summary.replace(".", '').toLowerCase();

    var tempFHigh = Math.round(forecast.temperatureHigh);
    var tempCHigh = convertFahrenheitToCelsius(tempFHigh);

    var tempFLow = Math.round(forecast.temperatureLow);
    var tempCLow = convertFahrenheitToCelsius(tempFLow);

    var speech = `The forecast for ${dayDisplayText} is ${forecastText} with a high of ${tempFHigh} degrees Fahrenheit or ${tempCHigh} degrees Celsius and a low of ${tempFLow} degrees Fahrenheit or ${tempCLow} degrees Celsius.`;
    var displayText = `The forecast for ${dayDisplayText} is ${forecastText} with a high of ${tempFHigh}°F (${tempCHigh}°C) and a low of ${tempFLow}°F (${tempCLow}°C).`;

    return { speech, displayText };
}

function convertFahrenheitToCelsius(tempF) {
    return Math.round((tempF - 32) * (5 / 9));
}

app.listen(port);
console.log(hostname + ": App listening on port " + port);
