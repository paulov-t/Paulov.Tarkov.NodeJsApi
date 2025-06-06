const bsgHelper = require('./../bsgHelper');

class MatchGroup {
    constructor() {
         /**
         * @type {String}
         */
         this.groupId = bsgHelper.generateMongoId();

         /**
          * @type {String[]}
          */
         this.groupMembers = []

          /**
          * @type {String[]}
          */
          this.groupMemberInvites = []

          /** */
          this.raidSettings = {}
    }
}

module.exports.MatchGroup = MatchGroup;