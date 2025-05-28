const { EChatMemberSide } = require("./Enums/EChatMemberSide");

class UpdatableChatMemberInfo {

    /**
     * 
     * @param {*} id 
     * @param {*} nickname 
     * @param {EChatMemberSide} side 
     * @param {*} level 
     * @param {*} memberCategory 
     * @param {*} ignored 
     * @param {*} banned 
     */
    constructor(id = "", nickname = "", side = EChatMemberSide.Trader, level = 1, memberCategory = 1, ignored = false, banned = false) {
        this.Id = id;
        this.Nickname = nickname
        /**
         * @type {EChatMemberSide}
         */
        this.Side = side;
        this.Level = level;
        this.MemberCategory = memberCategory;
        this.Ignored = ignored;
        this.Banned = banned;
    }
}

module.exports.UpdatableChatMemberInfo = UpdatableChatMemberInfo;
