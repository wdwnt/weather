const express = require('express');
const app = express();
const os = require("os");
const fetch = require("node-fetch");

const hostname = os.hostname();

const port = process.env.PORT || 3000;

app.use(function(_req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/api/all", async (_req, resp) => {
    const response = await getWeatherInformation('all');

    return resp.json(response);
});

app.get("/api/:destination", async (req, resp) => {
    const destination = req.params.destination;
    const destinationWeather = await getWeatherForDestination(destination);

    resp.json(destinationWeather.weather);
});

app.get("/api/speech/:destination", async (req, resp) => {
    const destination = req.params.destination;

    const destinationWeather = await getWeatherForDestination(destination);
    const weather = destinationWeather.weather;
    const destinationName = destinationWeather.destinationName;

    const currentlySummary = weather.currently.summary.toLowerCase();
    const currentlyTempF = Math.round(weather.currently.temperature);
    const currentlyTempC = convertFahrenheitToCelsius(currentlyTempF);
    const currentConditions = `The weather at ${destinationName} is ${currentlySummary} and ${currentlyTempF} degrees Fahrenheit or ${currentlyTempC} degrees Celsius.`;
    const currentConditionsDisplay = `The weather at ${destinationName} is ${currentlySummary} and ${currentlyTempF}°F (${currentlyTempC}°C).`;

    const todaysForecast = formatForecastForSpeech(weather.daily.data[0], 'today');
    const tomorrowsForecast = formatForecastForSpeech(weather.daily.data[1], 'tomorrow');

    const speech = `${currentConditions} ${todaysForecast.speech} ${tomorrowsForecast.speech}`;
    const displayText = `${currentConditionsDisplay} ${todaysForecast.displayText} ${tomorrowsForecast.displayText}`;

    resp.json({ speech, displayText });
});

async function getWeatherForDestination(destination) {
    let weather = {};
    let destinationName = 'Walt Disney World';

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
    return await getWeatherInformation('wdw');
}

async function getDLRWeatherInformation() {
    return await getWeatherInformation('dlr');
}

async function getTDRWeatherInformation() {
    return await getWeatherInformation('tdr');
}

async function getDLPWeatherInformation() {
    return await getWeatherInformation('dlp');
}

async function getHKDLWeatherInformation() {
    return await getWeatherInformation('hkdl');
}

async function getSHDRWeatherInformation() {
    return await getWeatherInformation('shdr');
}

async function getWeatherInformation(key) {
    const data = await fetch(
      `https://fastpass.wdwnt.com/weather/${key}`
    );

    return await data.json();
}

function formatForecastForSpeech(forecast, dayDisplayText) {
    const forecastText = forecast.summary.replace(".", '').toLowerCase();

    const tempFHigh = Math.round(forecast.temperatureHigh);
    const tempCHigh = convertFahrenheitToCelsius(tempFHigh);

    const tempFLow = Math.round(forecast.temperatureLow);
    const tempCLow = convertFahrenheitToCelsius(tempFLow);

    const speech = `The forecast for ${dayDisplayText} is ${forecastText} with a high of ${tempFHigh} degrees Fahrenheit or ${tempCHigh} degrees Celsius and a low of ${tempFLow} degrees Fahrenheit or ${tempCLow} degrees Celsius.`;
    const displayText = `The forecast for ${dayDisplayText} is ${forecastText} with a high of ${tempFHigh}°F (${tempCHigh}°C) and a low of ${tempFLow}°F (${tempCLow}°C).`;

    return { speech, displayText };
}

function convertFahrenheitToCelsius(tempF) {
    return Math.round((tempF - 32) * (5 / 9));
}

app.listen(port);
console.log(hostname + ": App listening on port " + port);
