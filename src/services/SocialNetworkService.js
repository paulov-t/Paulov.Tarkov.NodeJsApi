const { AccountService } = require("./accountService");
const { AccountProfileMode, Account } = require("../models/Account");
const { Message } = require("../models/Message");
const { Dialogue } = require("../models/Dialogue");
const { EMessageType } = require("../models/Enums/EMessageType");
const { UpdatableChatMember } = require("../models/UpdatableChatMember");
const { UpdatableChatMemberInfo } = require("../models/UpdatableChatMemberInfo");
const { EChatMemberSide } = require("../models/Enums/EChatMemberSide");
const { TraderService } = require("./TraderService");

/**
 * A service to manage friendship, grouping and messages in the app
 */
class SocialNetworkService {
    constructor() {

    }

    addFriend(myAccount, friendId) {
        const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
        if (!myAccountByMode) {
            return false;
        }

        // Ensure friends exists
        if (!myAccountByMode.socialNetwork.friends)
            myAccountByMode.socialNetwork.friends = [];

        const index = myAccountByMode.socialNetwork.friendRequestInbox.findIndex((v) => { return v.from == friendId; });
        if (index != -1)
            myAccountByMode.socialNetwork.friendRequestInbox.splice(index, 1);

        myAccountByMode.socialNetwork.friends.push(friendId);

        AccountService.saveAccount(myAccount);
        return true;

    }

    /**
     * 
     * @param {Account} myAccount 
     * @returns {Boolean}
     */
    addAllFriends(myAccount) {

        /**
         * @type {AccountProfileMode}
         */
        const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
        if (!myAccountByMode) {
            return false;
        }

        // Ensure friends exists
        if (!myAccountByMode.socialNetwork.friends)
            myAccountByMode.socialNetwork.friends = [];

        for(const friendId of myAccountByMode.socialNetwork.friendRequestInbox)
            this.addFriend(myAccount, friendId);
        
        myAccountByMode.socialNetwork.friendRequestInbox = [];

        AccountService.saveAccount(myAccount);
        return true;

    }

    /**
     * 
     * @param {*} fromId 
     * @param {*} targetAccountId 
     * @param {*} mode 
     * @param {Message} message 
     * @param {*} items 
     * @returns 
     */
    sendMessageToAccount(fromId, targetAccountId, mode, message, items) {
        const targetAccount = AccountService.getAccount(targetAccountId);
        if (!targetAccount) {
            return false;
        }

        const targetAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(targetAccount, mode);
        if (!targetAccountByMode) {
            return false;
        }

        // Ensure dialogues array exists
        if (!targetAccountByMode.socialNetwork.dialogues)
            targetAccountByMode.socialNetwork.dialogues = [];

        let chatMemberSide = EChatMemberSide.Usec;
        if (TraderService.getTrader(fromId)) {
            chatMemberSide = EChatMemberSide.Trader;
        }

        // Ensure dialogue exists
        let dialogue = targetAccountByMode.socialNetwork.dialogues.find((d) => d._id === fromId);
        if (!dialogue) {
            dialogue = new Dialogue(fromId);
            dialogue.message = message;
            dialogue.attachmentsNew = 0;
            dialogue.new = 1;
            dialogue.type = EMessageType.NpcTraderMessage;
            dialogue.Users = [new UpdatableChatMember(
                fromId
                , fromId
                , new UpdatableChatMemberInfo(fromId, fromId, chatMemberSide))];
            targetAccountByMode.socialNetwork.dialogues.push(dialogue);
        }

        dialogue.messages.push(message);
        dialogue.new = 1;

        AccountService.saveAccount(targetAccount);
        return true;
    }
}

module.exports.SocialNetworkService = new SocialNetworkService();