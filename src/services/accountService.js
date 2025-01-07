const fs =  require('fs');
const path =  require('path');
const bsgHelper = require('../bsgHelper');
// var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const { Account, AccountProfileMode, AccountProfileCharacter, AccountProfileCharacterSet } = require('../models/Account');
const { BotGenerationService } = require('./BotGenerationService');
const { SocialNetwork } = require('../models/SocialNetwork');
const { UpdatableChatMember } = require('../models/UpdatableChatMember');
const { UpdatableChatMemberInfo } = require('../models/UpdatableChatMemberInfo');

class AccountService {
    constructor() {
    //    this.saveDirectoryPath = path.join(process.cwd(), "data", "accounts");
       this.saveDirectoryPath = path.join(__dirname, "../", "data", "accounts");
       if (!fs.existsSync(this.saveDirectoryPath))
        fs.mkdir(this.saveDirectoryPath, { recursive: true }, (err) => {
            
            if(err)
                console.error(err);
        });
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
        if (!fs.existsSync(accountFilePath)) {
            const blankAccount = new Account();
            blankAccount.accountId = sessionId;
            this.saveAccount(blankAccount);
            return blankAccount;
        }
        return undefined;
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
            const newAccountId = bsgHelper.generateMongoId();
            account.accountId = newAccountId;
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
        const db = global._database;
        // clone the template
        const profile = db.getData(db["templates"]["profiles"])[account.edition][data.side.toLowerCase()]["character"];
        profile._id = sessionId;
        profile.aid = "1";// bsgHelper.generateMongoId();
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
        profile.Customization.Head = data.headId;
        profile.Health.UpdateTime = Math.floor(new Date().getTime() / 1000);
        profile.Quests = [];
        profile.Hideout.Seed = Math.floor(new Date().getTime() / 1000) + (8 * 60 * 60 * 24 * 365);
        profile.RepeatableQuests = [];
        profile.CarExtractCounts = {};
        profile.CoopExtractCounts = {};
        profile.Achievements = {};

        // Update EquipmentId
        this.updateInventoryEquipmentId(profile);

        if (!profile.UnlockedInfo) {
            profile.UnlockedInfo = { unlockedProductionRecipe: [] };
        }

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
        accountMode.characters.pmc.Inventory.items = this.replaceIDs(
            accountMode.characters.pmc.Inventory.items,
            accountMode.characters.pmc,
            undefined,
            accountMode.characters.pmc.Inventory.fastPanel,
        );

        accountMode.characters.scav.Inventory.items = this.replaceIDs(
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

    replaceInventoryItemIds (inventory) {

        const replacedIds = {};

        const equipmentId = inventory.equipment;
        const hideoutAreaStashes = Object.values(inventory.hideoutAreaStashes ?? {});

        for(const item of inventory.items) {

            // this has already been handled by updateInventoryEquipmentId
            if (item._id == equipmentId) {
                continue;
            }

            // Do not replace the IDs of specific types of items.
            if (
                item._id === inventory.equipment ||
                item._id === inventory.questRaidItems ||
                item._id === inventory.questStashItems ||
                item._id === inventory.sortingTable ||
                item._id === inventory.stash ||
                item._id === inventory.hideoutCustomizationStashId ||
                hideoutAreaStashes?.includes(item._id)
            ) {
                continue;
            }

            const oldId = item._id;
            const newId = bsgHelper.generateMongoId();
            replacedIds[item._id] = newId
            item._id = newId;
            if (item.parentId !== undefined && replacedIds[item.parentId] !== undefined)
                item.parentId = replacedIds[item.parentId];
        }
        
        return inventory;
    }

    /**
     * TODO: Look into this! Seems overly complicated...
     * Regenerate all GUIDs with new IDs, for the exception of special item types (e.g. quest, sorting table, etc.) This
     * function will not mutate the original items array, but will return a new array with new GUIDs.
     *
     * @param originalItems Items to adjust the IDs of
     * @param pmcData Player profile
     * @param insuredItems Insured items that should not have their IDs replaced
     * @param fastPanel Quick slot panel
     * @returns Item[]
     */
    replaceIDs(
        originalItems,
        pmcData,
        insuredItems,
        fastPanel,
    ) {
        let items = JSON.parse(JSON.stringify((originalItems)));
        let serialisedInventory = JSON.stringify(items);
        const hideoutAreaStashes = Object.values(pmcData?.Inventory.hideoutAreaStashes ?? {});

        for (const item of items) {
            if (pmcData) {
                // Insured items should not be renamed. Only works for PMCs.
                if (insuredItems?.find((insuredItem) => insuredItem.itemId === item._id)) {
                    continue;
                }

                // Do not replace the IDs of specific types of items.
                if (
                    item._id === pmcData.Inventory.equipment ||
                    item._id === pmcData.Inventory.questRaidItems ||
                    item._id === pmcData.Inventory.questStashItems ||
                    item._id === pmcData.Inventory.sortingTable ||
                    item._id === pmcData.Inventory.stash ||
                    item._id === pmcData.Inventory.hideoutCustomizationStashId ||
                    hideoutAreaStashes?.includes(item._id)
                ) {
                    continue;
                }
            }

            // Replace the ID of the item in the serialised inventory using a regular expression.
            const oldId = item._id;
            const newId = bsgHelper.generateMongoId();
            serialisedInventory = serialisedInventory.replace(new RegExp(oldId, "g"), newId);

            // Also replace in quick slot if the old ID exists.
            if (fastPanel) {
                for (const itemSlot in fastPanel) {
                    if (fastPanel[itemSlot] === oldId) {
                        fastPanel[itemSlot] = fastPanel[itemSlot].replace(new RegExp(oldId, "g"), newId);
                    }
                }
            }
        }

        items = JSON.parse(serialisedInventory);

        // fix duplicate id's
        const dupes = {};
        const newParents = {};
        const childrenMapping = {};
        const oldToNewIds = {};

        // Finding duplicate IDs involves scanning the item three times.
        // First scan - Check which ids are duplicated.
        // Second scan - Map parents to items.
        // Third scan - Resolve IDs.
        for (const item of items) {
            dupes[item._id] = (dupes[item._id] || 0) + 1;
        }

        for (const item of items) {
            // register the parents
            if (dupes[item._id] > 1) {
                const newId = bsgHelper.generateMongoId();

                newParents[item.parentId] = newParents[item.parentId] || [];
                newParents[item.parentId].push(item);
                oldToNewIds[item._id] = oldToNewIds[item._id] || [];
                oldToNewIds[item._id].push(newId);
            }
        }

        for (const item of items) {
            if (dupes[item._id] > 1) {
                const oldId = item._id;
                const newId = oldToNewIds[oldId].splice(0, 1)[0];
                item._id = newId;

                // Extract one of the children that's also duplicated.
                if (oldId in newParents && newParents[oldId].length > 0) {
                    childrenMapping[newId] = {};
                    for (const childIndex in newParents[oldId]) {
                        // Make sure we haven't already assigned another duplicate child of
                        // same slot and location to this parent.
                        const childId = this.getChildId(newParents[oldId][childIndex]);

                        if (!(childId in childrenMapping[newId])) {
                            childrenMapping[newId][childId] = 1;
                            newParents[oldId][childIndex].parentId = newId;
                            // Some very fucking sketchy stuff on this childIndex
                            // No clue wth was that childIndex supposed to be, but its not
                            newParents[oldId].splice(Number.parseInt(childIndex), 1);
                        }
                    }
                }
            }
        }

        return items;
    }

    /**
     * 
     * @param {*} item 
     * @returns {String}
     */
    getChildId(item) {
        if (!("location" in item)) {
            return item.slotId;
        }

        return `${item.slotId},${(item.location).x},${(item.location).y}`;
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
            account = JSON.parse(fs.readFileSync(accountFilePath).toString());
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

        /**
         * @type {AccountProfileMode}
         */
        const accountProfile = account.modes[mode];
        return accountProfile;
    }

    getAccountByUsernamePassword (username, password) {

        var hashedPassword = bcrypt.hashSync(password, 10);

        const allAccounts = this.getAllAccounts();
        for(const account of allAccounts)
        {
            if (account.username == username)// && account.password == hashedPassword)
                return account;
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

        const accountType = typeof(account);
        if (accountType !== 'object')
            return;

        const accountCurrentMode = account.currentMode
        if (!accountCurrentMode)
            return;

        if (account.accountId === undefined) {
            const newAccountId = bsgHelper.generateMongoId();
            account.accountId = newAccountId;
        }

        if (!account.accountId)
            return;

        if (!account.accountId)
            return;


        const accountFilePath = path.join(this.saveDirectoryPath, `${account.accountId}.json`);

        fs.writeFileSync(accountFilePath, JSON.stringify(account, null, "\t"));
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

}

module.exports.AccountService = new AccountService();
