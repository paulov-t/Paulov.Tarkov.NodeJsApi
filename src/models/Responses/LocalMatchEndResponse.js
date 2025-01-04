const { Database } = require('../../classes/database');
const bsgHelper = require('./../../bsgHelper');

class LocalMatchEndResponse {
    
    constructor() {
        this.serverId = bsgHelper.generateMongoId();
        this.results = {};
        this.lostInsuredItems = {};
        this.transferItems = {};
        this.locationTransit = {};
    }
}

module.exports.LocalMatchEndResponse = LocalMatchEndResponse;