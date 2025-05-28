const { Database } = require('./../classes/database');
const { EnvironmentVariableService } = require('./EnvironmentVariableService');

/**
 * A service to get and process all Location's in Tarkov database.
 */
class LocationService 
{
    constructor() {

    }

    /**
     * 
     * @returns {Object} - All locations data
     * @description This function retrieves all locations data from the database and processes it. 
     */
    getAllLocationData() {

        const locations = {};
        /**
         * @type {Database}
         */
        const db = Database;
        const locationEntries = db["locations"];
        for(const locationId in locationEntries) {
    
            const entry = locationEntries[locationId];
            if (!entry)
                continue;
    
            if (!entry.base)
                continue;
    
            const mapBase = db.getData(entry.base);
            if (!mapBase) {
                continue;
            }

            const envVars = EnvironmentVariableService.getEnvironmentVariables();

            if (envVars.LABS_REQUIRES_KEYCARD == 'false') {
                mapBase.AccessKeys = [];
                mapBase.AccessKeysPvE = [];
            }

            if (envVars.BOTS_ENABLED == 'false') {
                // If bots are disabled, remove all bot types from the map
                mapBase.BossLocationSpawn = [];
                mapBase.BotMax = 0;
                mapBase.BotMaxPvE = 0;
                for (const spawnPointParam of mapBase.SpawnPointParams) {
                    spawnPointParam.Sides = [];
                }
            }

    
            // This should fix the forced online for most scenarios
            mapBase.ForceOnlineRaidInPVE = false;
            // Clear out loot array
            mapBase.Loot = [];
            // Add map base data to dictionary
            locations[mapBase._Id] = mapBase;
        }
    
        return { locations: locations, paths: db.getData(db.locations.base).paths };
    }

    /**
     * 
     * @param {String} locationName 
     * @returns 
     */
    getLocationByLocationName(locationName) {
        const locationNameLower = locationName.toLowerCase();
        const allLocations = this.getAllLocationData().locations;
        for (const locationId in allLocations) {
            const location = allLocations[locationId];
            if (locationNameLower.includes(location.Id.toLowerCase())) {
                return location;
            }
        }
    }
}

module.exports.LocationService = LocationService;