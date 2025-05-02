const { AccountService } = require("./AccountService");
const { AccountProfileMode, Account } = require("../models/Account");
const { Message } = require("../models/Message");
const { Dialogue } = require("../models/Dialogue");
const { EMessageType } = require("../models/Enums/EMessageType");

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

        // Ensure messages exists
        if (!targetAccountByMode.socialNetwork.dialogues)
            targetAccountByMode.socialNetwork.dialogues = [];

        const dialogue = new Dialogue();
        dialogue.message = message;
        dialogue.attachmentsNew = 0;
        dialogue.new = 1;
        // dialogue.messages = [message];
        dialogue.type = EMessageType.NpcTraderMessage;
        dialogue.Users = [fromId];
        targetAccountByMode.socialNetwork.dialogues.push(dialogue);

        // if (targetAccountByMode.socialNetwork.dialogues.findIndex((v) => { return v.uid == message.uid; }) === -1) 
        //     targetAccountByMode.socialNetwork.dialogues.push(message);

        AccountService.saveAccount(targetAccount);
        return true;
    }
}

module.exports.SocialNetworkService = new SocialNetworkService();