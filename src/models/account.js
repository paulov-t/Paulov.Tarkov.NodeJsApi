const { SocialNetwork } = require("./SocialNetwork");

class Account {
    constructor() {
        this.accountId = "";
        this.username = "Developer";
        this.password = "";
        this.edition = "Standard";
         
        this.modes = {
            /**
             * PVP
             * @type {AccountProfileMode}
             * @public
             */
            regular: new AccountProfileMode("regular"),
            /**
             * PVE
             * @type {AccountProfileMode}
             * @public
             */
            pve: new AccountProfileMode("pve"),
            /**
             * Arena
             * @type {AccountProfileMode}
             * @public
             */
            arena: new AccountProfileMode("arena")
        }
        this.currentMode = "regular"
    }
}

class AccountProfileMode {
    constructor(name = "pve") {
        this.name = name;
        /**
         * 
         * @type {AccountProfileCharacterSet}
         * @public
         */
        this.characters = new AccountProfileCharacterSet();

        /**
         * @type {SocialNetwork}
         */
        this.socialNetwork = new SocialNetwork();
    }
}

class AccountProfileCharacterSet {
    constructor() {
        /**
         * 
         * @type {AccountProfileCharacter}
         * @public
         */
        this.pmc = undefined
        /**
         * 
         * @type {AccountProfileCharacter}
         * @public
         */
        this.scav = undefined
    }
}

class AccountProfileCharacter {
    constructor() {
        /**
         * @type {String}
         */
        this._id = "";
        this.Info = {}
        this.Inventory = {}
    }
}

module.exports.Account = Account;
module.exports.AccountProfileMode = AccountProfileMode;
module.exports.AccountProfileCharacterSet = AccountProfileCharacterSet;
module.exports.AccountProfileCharacter = AccountProfileCharacter;