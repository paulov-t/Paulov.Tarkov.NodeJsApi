const { Database } = require('./../classes/database');
const { DatabaseService } = require('./DatabaseService');
const { EnvironmentVariableService } = require('./EnvironmentVariableService');
const fs = require('fs');
const path = require('path');

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

        const zombiesJson = fs.readFileSync(path.join(process.cwd(), "data", "zombies.json")).toString();
        const allZombies = JSON.parse(zombiesJson);

        /**
         * @type {Database}
         */
        // const db = Database;
        const locationEntries = DatabaseService.getDatabase()["locations"];
        for(const locationId in locationEntries) {
    
            const entry = locationEntries[locationId];
            if (!entry)
                continue;
    
            if (!entry.base)
                continue;
    
            const mapBase = DatabaseService.getDatabase().getData(entry.base);
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
            } else if (envVars.ZOMBIES_ONLY == 'true') {
                const zombies = allZombies.halloweenzombies[locationId];
                if (zombies && zombies.length) {
                    for (const z of zombies) {
                        z.BossChance = 100;
                        z.ForceSpawn = true;
                        //
                        z.TriggerId = '';
                        z.TriggerName = '';
                        z.Time = 0;
                    }
                    mapBase.BossLocationSpawn.push(...zombies);
                }
            }

    
            // This should fix the forced online for most scenarios
            mapBase.ForceOnlineRaidInPVE = false;
            // Clear out loot array
            mapBase.Loot = [];
            // Add map base data to dictionary
            locations[mapBase._Id] = mapBase;
        }
    
        const paths = DatabaseService.getDatabase().getData(DatabaseService.getDatabase().locations.base).paths;

        return { locations: locations, paths: paths };
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