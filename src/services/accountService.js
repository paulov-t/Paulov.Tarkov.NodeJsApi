const fs =  require('fs');
const path =  require('path');
const bsgHelper = require('../bsgHelper');
var bcrypt = require('bcryptjs');
const { Account, AccountProfileMode, AccountProfileCharacter, AccountProfileCharacterSet } = require('./../models/Account');
const { BotGenerationService } = require('./BotGenerationService');
const { SocialNetwork } = require('./../models/SocialNetwork');
const { UpdatableChatMember } = require('./../models/UpdatableChatMember');
const { UpdatableChatMemberInfo } = require('./../models/UpdatableChatMemberInfo');
const LoggingService = require('./LoggingService');
const { InventoryService } = require('./InventoryService');
const { DatabaseService } = require('./DatabaseService');
const { Database } = require('../classes/database');

class AccountService {
    constructor() {
       this.saveDirectoryPath = path.join(__dirname, "../", "data", "accounts");
       if (!fs.existsSync(this.saveDirectoryPath))
        fs.mkdir(this.saveDirectoryPath, { recursive: true }, (err) => {
            
            if(err)
                console.error(err);
        });

        /**
         * @type {string[]}
         */
        this.activeAccounts = [];
    }

    /**
     * 
     * @returns {Account[]}
     */
    getAllAccounts() {

        const accounts = [];
        const accountDirectoryFiles = fs.readdirSync(this.saveDirectoryPath);
        for(const file of accountDirectoryFiles) {
            const accountId = file.replace(".json", "");
            const account = this.getAccount(accountId);
            if (account && account.accountId && account.accountId != "")
                accounts.push(account);
        }

        return accounts;
    }

    /**
     * Creates a new Account for sessionId or returns undefined if already exists
     * @param {String} sessionId 
     * @returns {Account} New Account record OR undefined if already exists
     */
    createAccountBlank(sessionId) {

        const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
        // If account doesn't exist, create it
        if (!this.accountExists(sessionId)) {
            const blankAccount = new Account();
            blankAccount.accountId = sessionId;
            this.saveAccount(blankAccount);
            return blankAccount;
        }
        return undefined;
    }

    accountExists(sessionId) {
        const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
        // If account doesn't exist, create it
        return (fs.existsSync(accountFilePath));
    }

    createAccountFromLauncher(data) {
        return this.createAccount(data, undefined, true);
    }

    /**
     * 
     * @param {*} data 
     * @param {*} sessionId 
     * @param {*} launcherCreate 
     * @returns {Account}
     */
    createAccount (data, sessionId, launcherCreate = false) {

        // If we are testing OR using the SwaggerUI and not passed sessionId, then generate one
        if (sessionId === undefined) 
            sessionId = bsgHelper.generateMongoId();

        // If we are testing OR using the SwaggerUI and not passed some data then recreate the data that BSG will send from Tarkov
        if ((data === undefined || (data.username === undefined && data.headId === undefined)) && launcherCreate === false) {
            data = {
                headId: "5cc084dd14c02e000b0550a3",
                nickname: "Hello",
                side: "Bear",
                voiceId: "6284d6948e4092597733b7a5",
                username: "Hello",
                password: "Hello",
                edition: "Standard",
                currentMode: "regular"
            }
        }

       /**
         * 
         * @type {Account}
         */
        const account = sessionId !== undefined ? this.getAccount(sessionId) : new Account();
        if (data.username !== undefined) {
            // const newAccountId = bsgHelper.generateMongoId();
            // account.accountId = newAccountId;
            account.username = data.username;
            var hashedPassword = bcrypt.hashSync(data.password, 8);
            account.password = hashedPassword;
            // https://www.freecodecamp.org/news/securing-node-js-restful-apis-with-json-web-tokens-9f811a92bb52/
            // TODO: Use this throughout Api calls
            // account.token = jwt.sign({ id: newAccountId }, "Paulov", {
            //     expiresIn: 86400 // expires in 24 hours
            // });
            account.edition = data.edition;
            account.currentMode = data.currentMode;
            if (launcherCreate) {
                this.saveAccount(account);
                return account;
            }
        }

        // If we are running via Swagger UI, fake a SessionId / Account creation Body
        if (data.side === undefined)
            data.side = "usec";

        const chosenSideCapital = data.side;
        /**
         * @type {Database}
         */
        const db = Database;
        // clone the template
        const profile = db.getData(db["templates"]["profiles"])[account.edition][data.side.toLowerCase()]["character"];
        profile._id = sessionId;
        profile.aid = Math.floor(Math.random() * 1000000);
        profile.savage = undefined;
        profile.Info.Nickname = data.nickname;
        profile.Info.LowerNickname = data.nickname.toLowerCase();
        profile.Info.RegistrationDate = Math.floor(Math.random() * 1000000);
        profile.Info.Voice = db.getData(db["templates"]["customization"])[data.voiceId]._name;
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
            },
            // Include empty Arena stats -- May be useful for future dev work
            Arena: {
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
        // Set the head to selected head from the UI
        profile.Customization.Head = data.headId;
        // Set the update time to now
        profile.Health.UpdateTime = Math.floor(new Date().getTime() / 1000);
        // Hideout requires a "Seed" of 32 characters. 
        // profile.Hideout.Seed = "5a305bcbaa18144c5153a75f3f5882ec"; // = Math.floor(new Date().getTime() / 1000) + (8 * 60 * 60 * 24 * 365);
        this.updateHideoutSeed(profile);
        // Empty the quests of the profile
        profile.Quests = [];
        profile.RepeatableQuests = [];
        // Empty the counts of the profile
        profile.CarExtractCounts = {};
        profile.CoopExtractCounts = {};

        // Keep the achievements even after a wipe (if they exist)
        profile.Achievements = {};
        if (account.modes[account.currentMode]?.characters?.pmc?.Achievements) {
            profile.Achievements = account.characters.pmc.Achievements;
        }

        // Update EquipmentId
        InventoryService.updateInventoryEquipmentId(profile);

        if (!profile.UnlockedInfo) {
            profile.UnlockedInfo = { unlockedProductionRecipe: [] };
        }

        this.addMissingContainersToProfile(profile);

        let accountMode = new AccountProfileMode();
        accountMode = account.modes[account.currentMode];
        accountMode.characters.pmc = profile;
        const profileScav = fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString();
        accountMode.characters.scav = JSON.parse(profileScav).scav;
        accountMode.characters.pmc.savage = accountMode.characters.scav._id;
        // const profileScav = BotGenerationService.generateBot(accountMode.characters.pmc);
        // accountMode.characters.scav = JSON.parse(JSON.stringify(profileScav));
        // accountMode.characters.pmc.savage = undefined;// accountMode.characters.scav.aid;
        // accountMode.characters.scav.savage = undefined;// accountMode.characters.scav.aid;
        // accountMode.characters.scav.Info.MemberCategory = accountMode.characters.pmc.Info.MemberCategory;
        // accountMode.characters.scav.Info.SelectedMemberCategory = accountMode.characters.pmc.Info.SelectedMemberCategory;

        // Change item IDs to be unique
        accountMode.characters.pmc.Inventory.items = InventoryService.replaceIDs(
            accountMode.characters.pmc.Inventory.items,
            accountMode.characters.pmc,
            undefined,
            accountMode.characters.pmc.Inventory.fastPanel,
        );

        accountMode.characters.scav.Inventory.items = InventoryService.replaceIDs(
            accountMode.characters.scav.Inventory.items,
            accountMode.characters.scav,
            undefined,
            accountMode.characters.scav.Inventory.fastPanel,
        );

        const traderEntries = db["traders"];
        for (const traderId in traderEntries) {
            const traderBase = db.getData(traderEntries[traderId].base);
            accountMode.characters.pmc.TradersInfo[traderId] = 
            {
                disabled: false,
                loyaltyLevel: 1,
                salesSum: 0,
                standing: 0.2,
                nextResupply: traderBase.nextResupply,
                unlocked: traderBase.unlockedByDefault,
            }
        }

        account.friends = [];

        this.saveAccount(account);
        return account;
    }

    addMissingContainersToProfile(profile) {

        if(!profile)
            return;

        if(!profile.Inventory)
            return;

        if(!profile.Inventory.items)
            return;

        if (!profile.Inventory.items.find((item) => item._id === profile.Inventory.hideoutCustomizationStashId)) {
            profile.Inventory.items.push({
                _id: profile.Inventory.hideoutCustomizationStashId,
                _tpl: "673c7b00cbf4b984b5099181"
            });
        }

        if (!profile.Inventory.items.find((item) => item._id === profile.Inventory.sortingTable)) {
            profile.Inventory.items.push({
                _id: profile.Inventory.sortingTable,
                _tpl: "602543c13fee350cd564d032"
            });
        }

        if (!profile.Inventory.items.find((item) => item._id === profile.Inventory.questStashItems)) {
            profile.Inventory.items.push({
                _id: profile.Inventory.questStashItems,
                _tpl: "5963866b86f7747bfa1c4462"
            });
        }

        if (!profile.Inventory.items.find((item) => item._id === profile.Inventory.questRaidItems)) {
            profile.Inventory.items.push({
                _id: profile.Inventory.questRaidItems,
                _tpl:  "5963866286f7747bf429b572"
            });
        }
    }
     

    /**
     * 
     * @param {string} tpl 
     * @returns {boolean}
     */
    isDogtag(tpl) {
        const dogTagTpls = [
            "59f32bb586f774757e1e8442",
            "6662e9aca7e0b43baa3d5f74",
            "675dc9d37ae1a8792107ca96",
            "675dcb0545b1a2d108011b2b",
            "6662e9cda7e0b43baa3d5f76",
            "59f32c3b86f77472a31742f0",
            "6662e9f37fa79a6d83730fa0",
            "6764207f2fa5e32733055c4a",
            "6764202ae307804338014c1a",
            "6662ea05f6259762c56f3189",
        ];

        return dogTagTpls.includes(tpl);
    }

    /**
     * 
     * @param {*} sessionId 
     * @returns {Account} account
     */
    getAccount (sessionId) {

        if (!sessionId)
            return undefined;

        let account = this.createAccountBlank(sessionId);
        // If account exists, the blank account wont work. Get account from save file.
        if (account === undefined) {
            const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
            account = new Account();
            const fileData = fs.readFileSync(accountFilePath);
            const fileDataString = fileData.toString();
            if (fileDataString.length == 0) {
                fs.rmSync(accountFilePath);
                return undefined;
            }
            else {
                try {
                    account = JSON.parse(fileData);
                }
                catch {
                    fs.rmSync(accountFilePath);
                    return undefined;
                }
            }
        }

        return account;
    }

    /**
     * 
     * @param {String} sessionId 
     * @returns {AccountProfileMode} Account Profile by Mode (can be undefined!)
     */
    getAccountProfileByCurrentMode (sessionId) {

        let account = this.createAccountBlank(sessionId);
        // If account exists, the blank account wont work. Get account from save file.
        if (!account) {
            const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
            account = new Account();
            account = JSON.parse(fs.readFileSync(accountFilePath).toString());
        }

        const modeProfile = this.getAccountProfileByMode(sessionId, account.currentMode);
        if (!modeProfile)
            return undefined;

        // Protection for lack of SocialNetwork on Profile
        if(!modeProfile.socialNetwork)
            modeProfile.socialNetwork = new SocialNetwork();

        return modeProfile;
    }

    /**
     * 
     * @param {Account} account 
     * @returns {AccountProfileMode} Account Profile by Mode (can be undefined!)
     */
    getAccountProfileByCurrentModeFromAccount (account) {

        const modeProfile = this.getAccountProfileByModeFromAccount(account, account.currentMode);
        if (!modeProfile)
            return undefined;

        // Protection for lack of SocialNetwork on Profile
        if(!modeProfile.socialNetwork)
            modeProfile.socialNetwork = new SocialNetwork();

        return modeProfile;
    }

    /**
     * 
     * @param {String} sessionId 
     * @param {String} mode Game Mode (pvp, pve, arena) 
     * @returns {AccountProfileMode} Account Profile by Mode (can be undefined!)
     */
    getAccountProfileByMode (sessionId, mode) {

        if (!sessionId)
            return undefined;

        if (!mode)
            return undefined;

        let account = this.createAccountBlank(sessionId);
        // If account exists, the blank account wont work. Get account from save file.
        if (!account) {
            const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
            account = new Account();
            account = JSON.parse(fs.readFileSync(accountFilePath).toString());
        }

        /**
         * @type {AccountProfileMode}
         */
        const accountProfile = account.modes[mode];
        return accountProfile;
    }

     /**
     * 
     * @param {Account} account 
     * @param {String} mode Game Mode (pvp, pve, arena) 
     * @returns {AccountProfileMode} Account Profile by Mode (can be undefined!)
     */
     getAccountProfileByModeFromAccount (account, mode) {

        if (!account)
            return undefined;

        if (!mode)
            return undefined;

        if (!account.modes)
            return undefined;

        /**
         * @type {AccountProfileMode}
         */
        const accountProfile = account.modes[mode];
        return accountProfile;
    }

    /**
     * 
     * @param {String} username 
     * @param {String} password 
     * @returns {Account}
     */
    getAccountByUsernamePassword (username, password) {

        const allAccounts = this.getAllAccounts();
        for(const account of allAccounts)
        {
            if (account.username == username) {
                
                if (bcrypt.compareSync(password, account.password)) 
                    return account;
                else 
                    return "INVALID_PASSWORD";

            }
        }

        return undefined;
    }

    /**
     * 
     * @param {Account} account 
     * @returns 
     */
    saveAccount (account) {

        if (!account)
            return;

        if (!account.accountId)
            throw "You are trying to save an account without an AccountId?";

        const accountType = typeof(account);
        if (accountType !== 'object')
            return;

        if (!account.currentMode)
            account.currentMode = "regular";

        if (account.accountId === undefined) {
            const newAccountId = bsgHelper.generateMongoId();
            account.accountId = newAccountId;
        }

        if (!account.accountId)
            return;

        const accountFilePath = path.join(this.saveDirectoryPath, `${account.accountId}.json`);

        fs.writeFileSync(accountFilePath, JSON.stringify(account, null, "\t"));
    
        LoggingService.logSuccess(`Saved Account ${account.accountId}!`);
    }

    /**
     * 
     * @param {Account} account 
     * @param {String} gameMode 
     * @returns {UpdatableChatMember}
     */
    getChatMemberProfile(account, gameMode = undefined) {

        let profile = undefined;
        if (!gameMode)
            profile = this.getAccountProfileByCurrentMode(account.accountId);
        else 
            profile = this.getAccountProfileByModeFromAccount(account, gameMode);

        const pmc = profile.characters.pmc;

        const chatMember = new UpdatableChatMember();
        chatMember.AccountId = account.accountId;
        chatMember._id = account.accountId;
        chatMember.aid = account.accountId;
        chatMember.Info = new UpdatableChatMemberInfo();
        chatMember.Info.Nickname = pmc.Info.Nickname;
        chatMember.Info.Side = pmc.Info.Side;
        chatMember.Info.Level = pmc.Info.Level;
        chatMember.Info.MemberCategory = pmc.Info.MemberCategory;
        chatMember.Info.SelectedMemberCategory = pmc.Info.SelectedMemberCategory;
        return chatMember;
    }

    /**
     * Recalculate level of player dependant on Experience. The client only updates Experience!
     * @param {AccountProfileCharacter} profile
     * @returns {Object} Recalculated newLevel of profile and hasChanged
     */
    recalculateLevel(profile) {
        let accExp = 0;

        const currentLevel = profile.Info.Level;

        const database = DatabaseService.getDatabase();
        const globalsResult = database.getData(database["globals"]);
        const xpTable = globalsResult.config.exp.level.exp_table;
        for (const [level, { exp }] of globalsResult.config.exp.level.exp_table.entries()) {
            accExp += exp;

            if (profile.Info.Experience < accExp) {
                break;
            }

            profile.Info.Level = level + 1;
        }

        return { newLevel: profile.Info.Level, hasChanged: profile.Info.Level !== currentLevel };
    }

    /**
     * Fixes the Health of the Character is something goes wrong. This is a strong assertion, it should never happen.
     * @param {Account} account
     * @param {AccountProfileCharacter} profile
     * @returns {Boolean} hasChanged
     */
    fixHealth(account, profile) {

        const database = DatabaseService.getDatabase();
        const templateProfile = database.getData(database["templates"]["profiles"])[account.edition][profile.Info.Side.toLowerCase()]["character"];
        templateProfile.Health.UpdateTime = Math.floor(new Date().getTime() / 1000);

        let result = false;
        for(const bpId in profile.Health.BodyParts) {
            if(profile.Health.BodyParts[bpId].Health.Maximum !== templateProfile.Health.BodyParts[bpId].Health.Maximum) {
                profile.Health.BodyParts[bpId].Health.Maximum = templateProfile.Health.BodyParts[bpId].Health.Maximum;
                result = true;
            }

            if(!profile.Health.BodyParts[bpId].Health.Current || profile.Health.BodyParts[bpId].Health.Current == null) {
                profile.Health.BodyParts[bpId].Health.Current =  profile.Health.BodyParts[bpId].Health.Maximum;
                result = true;
            }
        }

        if (result == true) {
            LoggingService.log(`Fixed Health for ${account.accountId}`);
        }

        return result;
    }

    /**
     * This is designed to fix any account issues after an official update to the game broke something
     */
    fixAccountsAfterUpdate() {

        for(var account of this.getAllAccounts()) {

            if (!account)
                continue;

            for(const mode in account.modes) {
                const accountProfile = this.getAccountProfileByModeFromAccount(account, mode);
                if (!accountProfile)
                    continue;

                // Seed 
                this.updateHideoutSeed(accountProfile.characters.pmc);
                this.addMissingContainersToProfile(accountProfile.characters.pmc);
            }

            this.saveAccount(account);
        }
    }

    /**
     * Attempts to update the Hideout Seed
     * @param {AccountProfileCharacter} pmcProfile 
     */
    updateHideoutSeed(pmcProfile) {

        if(!pmcProfile)
            return;

        if(!pmcProfile.Hideout)
            return;

        const rnd1 = Math.floor(Math.random() * 10);
        const rnd2 = Math.floor(Math.random() * 10);
        const rnd3 = Math.floor(Math.random() * 10);
        const newSeed = `${rnd1}a${rnd3}0${rnd2}bcbaa1${rnd2}14${rnd1}c5153a75f3f${rnd3}882ec`;
        LoggingService.logDebug(`Updating Hideout Seed from ${pmcProfile.Hideout.Seed} to ${newSeed}`)
        pmcProfile.Hideout.Seed = newSeed
    }

}

module.exports.AccountService = new AccountService();
