class UpdatableChatMemberInfo {
    constructor() {
        this.Id = "";
        this.Nickname = "";
        this.Side = "";
        this.Level = 1;
        this.MemberCategory = 1;
        this.Ignored = false;
        this.Banned = false;
    }
}

module.exports.UpdatableChatMemberInfo = UpdatableChatMemberInfo;
