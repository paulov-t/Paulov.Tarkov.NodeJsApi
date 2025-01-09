const { Weather } = require("./Weather");

class LocationWeatherTime {
    constructor() {
        this.weather = new Weather();

        this.season = 2;
        this.acceleration = 7;
        // this.date = this.weather.date;
        // this.time = this.weather.time;
        this.date = '2025-01-09';
        this.time = '04:42:10'

    }
}

module.exports.LocationWeatherTime = LocationWeatherTime;