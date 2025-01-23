const { Database } = require('../../classes/database');
const bsgHelper = require('../../bsgHelper');
const { LocationService } = require('../../services/LocationService');

class LocalMatchStartResponse {
    
    constructor(location) {
        this.serverId = bsgHelper.generateMongoId(),
        this.serverSettings = Database.getData(Database.templates.locationServices);
        /**
         * insureditems
         * @type {object}
         */
        this.profile = { insuredItems: [] },
        this.locationLoot = "";// new LocationService().getLocationByLocationName(location);
        this.transitionType = "None",
        this.transition = {
            transitionType: "None",
            transitionRaidId: bsgHelper.generateMongoId(),
            transitionCount: 0,
            visitedLocations: [],
        };
    }
}

module.exports.LocalMatchStartResponse = LocalMatchStartResponse;