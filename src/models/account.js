class Account {
    constructor() {
        this.accountId = "";
        this.username = "Developer";
        this.password = "";
        this.edition = "Standard";
        this.modes = {
            pve: new accountProfileMode()
        }
    }
}

class accountProfileMode {
    constructor() {
        this.name = "";
        this.character = {

        }
    }
}

module.exports.Account = Account;
module.exports.accountProfileMode = accountProfileMode;