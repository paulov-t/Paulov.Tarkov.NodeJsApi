const { generateMongoId } = require("../bsgHelper");

class GroupInvite {
    /**
     * 
     * @param {string} eventId 
     * @param {string} to 
     * @param {boolean} inLobby 
     */
    constructor(in_eventId = undefined, in_to = "", in_inLobby = false) {
        this.eventId = in_eventId === undefined ? generateMongoId() : in_eventId;
        this.to = in_to;
        this.inLobby = in_inLobby;
    }
}

module.exports.GroupInvite = GroupInvite;