const { logger } = require('./../classes/logger');
const { Database } = require('./../classes/database');
const bsgHelper = require('./../bsgHelper');
const { DatabaseService } = require('./DatabaseService');

/**
 * A service to get and process all Location's in Tarkov database.
 */
class LocationService 
{
    constructor() {

    }

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
     * @param {String} locationId 
     * @returns 
     */
    getLocationByLocationName(locationName) {
        const locationNameLower = locationName.toLowerCase();
        const allLocations = this.getAllLocationData().locations;
        for (const locationId in allLocations) {
            const location = allLocations[locationId];
            if (location.Name.toLowerCase() == locationNameLower) {
                return location;
            }
        }
    }
}

module.exports.LocationService = LocationService;