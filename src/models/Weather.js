class Weather {
    constructor() {

        this.cloud = 0.02;
        this.wind_speed = 0.01;
        this.wind_direction = 1;
        this.wind_gustiness = 0;
        this.rain = 0;
        this.rain_intensity = 0;
        this.fog = 0.01;
        this.temp = 2.7;
        this.pressure = 100;
        const dt = new Date();
        const dateOnlyString = dt.toISOString().slice(0, 10);
        const dateTimeString = dt.toISOString().replace("T", " ").replace("Z", "").slice(0, 19);
        this.date = `${dateOnlyString}`;
        this.time = `${dateTimeString}`;
        this.timestamp = Math.floor(dt.getTime() / 1000)
    }
}

module.exports.Weather = Weather;