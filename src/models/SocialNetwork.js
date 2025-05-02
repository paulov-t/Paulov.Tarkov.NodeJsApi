const { FriendRequest } = require('./FriendRequest');
const { MatchGroup } = require('./MatchGroup');
const { GroupInvite } = require('./GroupInvite');
const { Dialogue } = require('./Dialogue');

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

         /**
          * @type {GroupInvite}
          */
         this.groupInvite = undefined

         /**
          * @type {Array<Dialogue>}
          */
         this.dialogues = []
    }
}

module.exports.SocialNetwork = SocialNetwork;