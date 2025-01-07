const { UpdatableChatMemberInfo } = require("./UpdatableChatMemberInfo");

class UpdatableChatMember {
    constructor() {
        this._id = "";
        this.aid = "";
        this.AccountId = "";
        this.Info = new UpdatableChatMemberInfo()
    }
}

module.exports.UpdatableChatMember= UpdatableChatMember;
