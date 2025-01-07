const { FriendRequest } = require('./FriendRequest');
const { MatchGroup } = require('./MatchGroup');

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

         /**
          * @type {MatchGroup}
          */
         this.group = undefined
    }
}

module.exports.SocialNetwork = SocialNetwork;