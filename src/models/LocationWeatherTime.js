const { Weather } = require("./Weather");

class LocationWeatherTime {
    constructor() {
        this.weather = new Weather();

        /**
         * 2 = Winter
         */
        this.season = 1;
        this.acceleration = 7;
        this.date = new Date().toISOString().split('T')[0];
        this.time = '04:42:10'

    }
}

module.exports.LocationWeatherTime = LocationWeatherTime;