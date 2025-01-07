const { generateMongoId } = require("../bsgHelper");
const { UpdatableChatMember } = require("./UpdatableChatMember");

class FriendRequest {
    constructor() {
        /**
         * @type {String}
         */
        this._id = generateMongoId();
        /**
         * @type {String}
         */
        this.from = undefined;
        /**
         * @type {String}
         */
        this.to = undefined;
        /**
         * @type {Number}
         */
        this.date = Math.floor(Date.now() / 1000);
        /**
         * @type {UpdatableChatMember}
         */
        this.profile = undefined;
    }
}

module.exports.FriendRequest = FriendRequest;
