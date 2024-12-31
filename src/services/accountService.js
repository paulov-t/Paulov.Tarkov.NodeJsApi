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
        const profile = JSON.parse(JSON.stringify(db["templates"]["profiles"]["Edge Of Darkness"][data.side.toLowerCase()]["character"]));
        profile._id = sessionId;
        profile.aid = bsgHelper.generateMongoId();
        profile.Info.Nickname = data.nickname;
        profile.Info.LowerNickname = data.nickname.toLowerCase();
        profile.Info.RegistrationDate = Math.floor(Math.random() * 1000000);
        profile.Info.Voice = db["templates"]["customization"][data.voiceId]._name;
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

        account["pmc"] = profile;
        account["scav"] = JSON.parse(JSON.stringify(profile));
        account["scav"]._id = bsgHelper.generateMongoId();
        account["scav"].aid = bsgHelper.generateMongoId();
        account["pmc"].savage = account["scav"].aid;
        account["scav"].savage = account["scav"].aid;


        // account["pmc"].Inventory = this.replaceInventoryItemIds(account["pmc"].Inventory);
        // account["scav"].Inventory = this.replaceInventoryItemIds(account["scav"].Inventory);

        // Change item IDs to be unique
        account["pmc"].Inventory.items = this.replaceIDs(
            account["pmc"].Inventory.items,
            account["pmc"],
            undefined,
            account["pmc"].Inventory.fastPanel,
        );

        account["scav"].Inventory.items = this.replaceIDs(
            account["scav"].Inventory.items,
            account["scav"],
            undefined,
            account["scav"].Inventory.fastPanel,
        );

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
                const newId = this.hashUtil.generate();

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

    getAccount (sessionId) {

        this.createAccountBlank(sessionId);
        const accountFilePath = path.join(this.saveDirectoryPath, `${sessionId}.json`);
        const account = JSON.parse(fs.readFileSync(accountFilePath).toString());

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
