const { UpdatableChatMemberInfo } = require("./UpdatableChatMemberInfo");

class UpdatableChatMember {
    constructor(id, aid, info) {
        this._id = id ||  "";
        this.aid = aid || "";
        this.AccountId = aid || "";
        this.Info = info || new UpdatableChatMemberInfo()
    }
}

module.exports.UpdatableChatMember= UpdatableChatMember;
