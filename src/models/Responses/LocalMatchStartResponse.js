const { Database } = require('../../classes/database');
const bsgHelper = require('../../bsgHelper');

class LocalMatchStartResponse {
    
    constructor(location) {
        this.serverId = bsgHelper.generateMongoId(),
        this.serverSettings = Database.getData(Database.templates.locationServices);
        /**
         * insureditems
         * @type {object}
         */
        this.profile = { insuredItems: [] },
        this.locationLoot = Database.getData(Database.locations[location].base),
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