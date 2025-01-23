const { generateMongoId } = require("../bsgHelper");

class GroupInvite {
    /**
     * 
     * @param {string} in_eventId 
     * @param {string} in_to 
     * @param {string} in_from 
     * @param {boolean} in_inLobby 
     */
    constructor(in_eventId = undefined, in_to = "", in_from = "", in_inLobby = false) {
        this.eventId = in_eventId === undefined ? generateMongoId() : in_eventId;
        this.to = in_to;
        this.from = in_from;
        this.inLobby = in_inLobby;
        /**
         * a list of members expected to be in this group
         */
        this.members = [];
    }
}

module.exports.GroupInvite = GroupInvite;