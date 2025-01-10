const { Inventory } = require("./Inventory");
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

        /**
         * @type {Object}
         */
        this.raidConfiguration = {};
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
        /**
         * @type {Object}
         */
        this.Achievements = {}

        /**
         * @type {Object}
         */
        this.Encyclopedia = {}

        this.Health = {}

        this.Info = {}
        /**
         * @type {Inventory}
         */
        this.Inventory = new Inventory();
    }
}

class AccountProfileCharacterInfo {
    constructor() {
        this.Nickname = "";
        this.Side = "";
        this.Level = 0;
        this.PrestigeLevel = 0;
        this.MemberCategory = "";
        this.SelectedMemberCategory = "";
        this.SavageLockTime = 0;
        this.SavageNickname = "";
        this.GameVersion = "";
        this.HasCoopExtension = true;
        this.Health = {};
    }
}

module.exports.Account = Account;
module.exports.AccountProfileMode = AccountProfileMode;
module.exports.AccountProfileCharacterSet = AccountProfileCharacterSet;
module.exports.AccountProfileCharacter = AccountProfileCharacter;
module.exports.AccountProfileCharacterInfo = AccountProfileCharacterInfo;