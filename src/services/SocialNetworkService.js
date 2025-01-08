const { AccountService } = require("./AccountService");
const { AccountProfileMode, Account } = require("../models/Account");

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
}

module.exports.SocialNetworkService = new SocialNetworkService();