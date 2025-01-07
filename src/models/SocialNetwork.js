const { FriendRequest } = require('./FriendRequest');

class SocialNetwork {
    constructor() {
        /**
         * @type {FriendRequest[]}
         */
        this.friendRequestInbox = [];
         /**
         * @type {FriendRequest[]}
         */
        this.friendRequestOutbox = [];

         /**
         * @type {String[]}
         */
         this.friends = [];
    }
}

module.exports.SocialNetwork = SocialNetwork;