const fs =  require('fs');
const path =  require('path');
const bsgHelper = require('../bsgHelper');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

class accountService {
    constructor() {
       this.saveDirectoryPath = path.join(process.cwd(), "data", "accounts");
       if (!fs.existsSync(this.saveDirectoryPath))
        fs.mkdirSync(this.saveDirectoryPath);
    }

    getAllAccounts() {

        const accountsShallow = [];
        const accountDirectoryFiles = fs.readdirSync(this.saveDirectoryPath);
        for(const file of accountDirectoryFiles) {
            const accountId = file.replace(".json", "");
            accountsShallow.push(this.getAccount(accountId));
        }

        return accountsShallow;
    }

    createAccountBlank(sessionId) {

        const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
        // If account doesn't exist, create it
        if (!fs.existsSync(accountFilePath)) {
            const blankAccount = {
                username: sessionId,
                password: "",
                edition: "Standard"
            };
            fs.writeFileSync(accountFilePath, JSON.stringify({}, null, ""));
        }

    }

    createAccountFromLauncher(data) {
        return this.createAccount(data, undefined, true);
    }

    createAccount (data, sessionId, launcherCreate = false) {

        const account = sessionId !== undefined ? this.getAccount(sessionId) : {};
        if (data.username !== undefined) {
            const newAccountId = bsgHelper.generateMongoId();
            account.accountId = newAccountId;
            account.username = data.username;
            var hashedPassword = bcrypt.hashSync(data.password, 8);
            account.password = hashedPassword;
            // https://www.freecodecamp.org/news/securing-node-js-restful-apis-with-json-web-tokens-9f811a92bb52/
            account.token = jwt.sign({ id: newAccountId }, "Paulov", {
                expiresIn: 86400 // expires in 24 hours
            });
            account.edition = data.edition;
            if (launcherCreate) {
                this.saveAccount(account);
                return account;
            }
        }

        // If we are running via Swagger UI, fake a SessionId / Account creation Body
        if (data.side === undefined)
            data.side = "usec";

        const chosenSideCapital = data.side;

        const db = global._database;
        // clone the template
        const profile = JSON.parse(JSON.stringify(db["templates"]["profiles"]["Standard"][data.side.toLowerCase()]["character"]));
        profile._id = sessionId;
        profile.aid = sessionId;
        profile.Info.Nickname = data.nickname;
        profile.Info.LowerNickname = data.nickname.toLowerCase();
        profile.Info.Voice = db["templates"]["customization"][data.voiceId]._name;
        // profile.Customization = fileIO.readParsed(db.profile.defaultCustomization)[ChosenSideCapital]
        profile.Customization.Head = data.headId;
        profile.Info.RegistrationDate = ~~(new Date() / 1000);
        profile.Health.UpdateTime = ~~(Date.now() / 1000);
        profile.Stats = {
            Eft: {
                CarriedQuestItems: [],
                DamageHistory: { LethalDamagePart: "Head", LethalDamage: undefined, BodyParts: [] },
                DroppedItems: [],
                ExperienceBonusMult: 0,
                FoundInRaidItems: [],
                LastPlayerState: undefined,
                LastSessionDate: 0,
                OverallCounters: { Items: [] },
                SessionCounters: { Items: [] },
                SessionExperienceMult: 0,
                SurvivorClass: "Unknown",
                TotalInGameTime: 0,
                TotalSessionExperience: 0,
                Victims: [],
            }
        };
        profile.Info.NeedWipeOptions = [];
        profile.Quests = [];
        profile.RepeatableQuests = [];
        profile.CarExtractCounts = {};
        profile.CoopExtractCounts = {};
        profile.Achievements = {};

        // Update EquipmentId
        this.updateInventoryEquipmentId(profile);

        account["pmc"] = profile;
        account["scav"] = JSON.parse(JSON.stringify(profile));
        account["scav"]._id = bsgHelper.generateMongoId();
        account["scav"].aid = account["scav"]._id;
        account["pmc"].savage = account["scav"].aid;
        account["scav"].savage = account["scav"].aid;


        account["pmc"].Inventory = this.replaceInventoryItemIds(account["pmc"].Inventory);
        this.updateInventoryEquipmentId(account["scav"]);
        account["scav"].Inventory = this.replaceInventoryItemIds(account["scav"].Inventory);

        account.friends = [];

        this.saveAccount(account);
        return account;
    }

     /**
     * make profiles pmcData.Inventory.equipment unique
     * @param pmcData Profile to update
     */
     updateInventoryEquipmentId(profile) {
        const oldEquipmentId = profile.Inventory.equipment;
        profile.Inventory.equipment = bsgHelper.generateMongoId();

        for (const item of profile.Inventory.items) {
            if (item.parentId === oldEquipmentId) {
                item.parentId = profile.Inventory.equipment;
                continue;
            }

            if (item._id === oldEquipmentId) {
                item._id = profile.Inventory.equipment;
            }
        }
    }

    replaceInventoryItemIds (inventory) {

        const replacedIds = {};

        const equipmentId = inventory.equipment;

        for(const item of inventory.items) {

            // this has already been handled by updateInventoryEquipmentId
            if (item._id == equipmentId) {
                continue;
            }

            const newId = bsgHelper.generateMongoId();
            replacedIds[item._id] = newId
            item._id = newId;
            if (item.parentId !== undefined && replacedIds[item.parentId] !== undefined)
                item.parentId = replacedIds[item.parentId];
        }
        
        return inventory;
    }

    getAccount (sessionId) {

        this.createAccountBlank(sessionId);
        const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
        const account = JSON.parse(fs.readFileSync(accountFilePath).toString());

        if(account["pmc"] !== undefined)
            account["pmc"].Inventory = this.replaceInventoryItemIds(account["pmc"].Inventory);

        if(account["scav"] !== undefined)
            account["scav"].Inventory = this.replaceInventoryItemIds(account["scav"].Inventory);

        return account;
    }

    getAccountByUsernamePassword (username, password) {

        var hashedPassword = bcrypt.hashSync(password, 8);

        const allAccounts = this.getAllAccounts();
        for(const account of allAccounts)
        {
            if (account.username == username)// && account.password == hashedPassword)
                return account;
        }

        return undefined;
    }

    saveAccount (account) {

        if (account.accountId === undefined) {
            const newAccountId = bsgHelper.generateMongoId();
            account.accountId = newAccountId;
        }

        const accountFilePath = path.join(this.saveDirectoryPath, `${account.accountId}.json`);

        fs.writeFileSync(accountFilePath, JSON.stringify(account, null, "\t"));
    }
}

module.exports.accountService = new accountService();
