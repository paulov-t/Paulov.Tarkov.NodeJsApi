const { generateMongoId } = require("../bsgHelper");
const { logger } = require("../classes/logger");
const { AccountProfileCharacter } = require("../models/Account");
const { BotGenerationCondition } = require("../models/BotGenerationCondition");
const fs = require("fs");
const path = require("path");
const { InventoryService } = require("./InventoryService");
const { Database } = require("../classes/database");
const { DatabaseService } = require("./DatabaseService");

/**
 * A service to generate bots for a player scav or raids
 */
class BotGenerationService {
    constructor() {
        /**
         * @type {AccountProfileCharacter}
         */
        this.baseBot = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString()).scav;
        this.availableBackpacks = [];
    }

    cacheAllBots() { 

        if(this.availableBackpacks.length === 0) {
            this.availableBackpacks = InventoryService
            .getAllAvailableBackpacks()
            .map(x => ({ item: x, p: Database.getTemplateItemPrice(x._id) }))
            .sort((a, b) => { return a.p < b.p ? -1 : 1 });
        }

    }


    generateAllBots() {
        
    }

    /**
     * Generates a bot based on the conditions provided
     * @param {BotGenerationCondition} condition use { Role: 'playerscav', playerProfileName: 'Name' } for generating a player scav
     * @returns 
     */
    generateBot(condition) {

        this.cacheAllBots();

        const startTime = Date.now();

        if(condition.Role === 'playerscav') {
            condition.Role = 'assault';
        }

        /**
         * @type {AccountProfileCharacter}
         */
        const bot = JSON.parse(JSON.stringify(this.baseBot));
        bot._id = generateMongoId();
        bot.aid = generateMongoId();
        bot.Info.Side = condition.Role.includes("pmcBEAR") ? "Bear" : condition.Role.includes("pmcUSEC") ? "Usec" : "Savage";

        // Determine bot difficulty from condition
        if (condition.Difficulty)
            bot.Info.Settings.BotDifficulty = condition.Difficulty;

        // Update if a playerScav to the player's name
        bot.Info.MainProfileNickname = undefined;
        if (condition.playerProfileName)
            bot.Info.MainProfileNickname = condition.playerProfileName;

        const lowerRole = condition.Role.toLowerCase();
        const botDatabaseData = Database.getData(Database.bots.types[lowerRole]);

        // Setup the bot's Face, Body, Hands, Feet
        const headKeys = Object.keys(botDatabaseData.appearance.head);
        const bodyKeys = Object.keys(botDatabaseData.appearance.body);
        const feetKeys = Object.keys(botDatabaseData.appearance.feet);
        const handKeys = Object.keys(botDatabaseData.appearance.hands);
        bot.Customization.Head = headKeys[this.randomInteger(0, headKeys.length-1)];
        bot.Customization.Body = bodyKeys[this.randomInteger(0, bodyKeys.length-1)];
        bot.Customization.Feet = feetKeys[this.randomInteger(0, feetKeys.length-1)];
        bot.Customization.Hands = handKeys[this.randomInteger(0, handKeys.length-1)];

        // Setup the bot's Voice
        const voiceKeys = Object.keys(botDatabaseData.appearance.voice);
        bot.Info.Voice = voiceKeys[this.randomInteger(0, voiceKeys.length-1)];

        bot.Info.Nickname = botDatabaseData.firstName[this.randomInteger(0, botDatabaseData.firstName.length-1)];
        if (botDatabaseData.lastName && botDatabaseData.lastName.length > 0) {
            const lastName =  botDatabaseData.lastName[this.randomInteger(0, botDatabaseData.lastName.length-1)];
            if (lastName !== "Durkey")
                bot.Info.Nickname = bot.Info.Nickname + " " + lastName;
        }

        // Generate the bot's level (if PMC)
        this.generateBotLevel(bot);

        // Generate the bot's inventory
        const templateItemList = DatabaseService.getDatabase().getTemplateItems();
        

        // Remove the Pocket 1
        // InventoryService.removeItemFromSlot(bot, "pocket1");
        // // if (bot.Info.Side !== "Savage") {
        //     // Add Army bandage
        //     const pocket1Item = InventoryService.addTemplatedItemToSlot(bot, "5751a25924597722c463c472", "pocket1");
        //     pocket1Item.location = { 
        //         x: 0
        //         , y: 0
        //         , r: 0
        //         , "isSearched": false };
        // // }

        // Remove the Pocket 2
        InventoryService.removeItemFromSlot(bot, "pocket2");

        // Remove the Pocket 3
        InventoryService.removeItemFromSlot(bot, "pocket3");

        // Remove the Pocket 4
        InventoryService.removeItemFromSlot(bot, "pocket4");

        // Remove the Armband
        InventoryService.removeItemFromSlot(bot, "Armband");

        // Remove the Backpack (and all its items within it)
        InventoryService.removeItemFromSlot(bot, "Backpack");

        // Add a new backpack based on chance
        this.addBackpack(condition, bot);
        
        // Remove the Headwear
        InventoryService.removeItemFromSlot(bot, "Headwear");
        if (Object.keys(botDatabaseData.inventory.equipment.Headwear).length > 0) {
            this.addRandomItemToSlot(bot, "Headwear", Object.keys(botDatabaseData.inventory.equipment.Headwear));
        }

        // Remove the Eyewear
        InventoryService.removeItemFromSlot(bot, "Eyewear");
        if (Object.keys(botDatabaseData.inventory.equipment.Eyewear).length > 0) {
            this.addRandomItemToSlot(bot, "Eyewear", Object.keys(botDatabaseData.inventory.equipment.Eyewear));
        }

        // Remove the FaceCover
        InventoryService.removeItemFromSlot(bot, "FaceCover");
        if (Object.keys(botDatabaseData.inventory.equipment.FaceCover).length > 0) {
            const randomFaceCoverId = Object.keys(botDatabaseData.inventory.equipment.FaceCover)[this.randomInteger(0, Object.keys(botDatabaseData.inventory.equipment.FaceCover).length-1)];
            InventoryService.addTemplatedItemToSlot(bot, randomFaceCoverId, "FaceCover");
        }

        // Remove the Earpiece
        InventoryService.removeItemFromSlot(bot, "Earpiece");
        if (Object.keys(botDatabaseData.inventory.equipment.Earpiece).length > 0) {
            const randomEarpieceId = Object.keys(botDatabaseData.inventory.equipment.Earpiece)[this.randomInteger(0, Object.keys(botDatabaseData.inventory.equipment.Earpiece).length-1)];
            InventoryService.addTemplatedItemToSlot(bot, randomEarpieceId, "Earpiece");
        }

        // Remove the Scabbard / Knife
        InventoryService.removeItemFromSlot(bot, "Scabbard");
        if (Object.keys(botDatabaseData.inventory.equipment.Scabbard).length > 0) {
            const randomScabbardId = Object.keys(botDatabaseData.inventory.equipment.Scabbard)[this.randomInteger(0, Object.keys(botDatabaseData.inventory.equipment.Scabbard).length-1)];
            InventoryService.addTemplatedItemToSlot(bot, randomScabbardId, "Scabbard");
        }

        // Remove the Vest
        // InventoryService.removeItemFromSlot(bot, "Vest");
        // if (Object.keys(botDatabaseData.inventory.equipment.Vest).length > 0) {
        //     const randomVestId = Object.keys(botDatabaseData.inventory.equipment.Vest)[this.randomInteger(0, Object.keys(botDatabaseData.inventory.equipment.Vest).length-1)];
        //     // InventoryService.addTemplatedItemToSlot(bot, randomVestId, "Vest");
        // }


        // Remove the Holster
        InventoryService.removeItemFromSlot(bot, "Holster");
        if (Object.keys(botDatabaseData.inventory.equipment.Holster).length > 0) {
            let newItem = this.addRandomItemToSlot(bot, "Holster", Object.keys(botDatabaseData.inventory.equipment.Holster));
           

        }

        if (bot.Info.Side !== "Savage")
            this.addDogtag(bot);

        // Fix the Ids of the inventory
        InventoryService.updateInventoryEquipmentId(bot);
        bot.Inventory.items = InventoryService.replaceIDs(bot.Inventory.items, bot, undefined, undefined);
        

        const endTime = Date.now()
        logger.logDebug(`Bot generation for ${condition.Role} on ${bot.Info.Side} took: ${endTime - startTime}ms`);

        return bot;
    }

    addRandomItemToSlot(bot, slotId, randomItems) {
        const randomId = randomItems[this.randomInteger(0, randomItems.length-1)];
        const newItem = InventoryService.addTemplatedItemToSlot(bot, randomId, slotId);
        const presetItems = DatabaseService.getDatabase().getItemPresetArrayByEncyclopedia(randomId);

        const allItems = [];
        allItems.push(newItem);

        if (presetItems.length > 0) {
            const presetItem = presetItems[this.randomInteger(0, presetItems.length-1)];
            for (let i = 1 ; i < presetItem._items.length; i++) {
                const item = presetItem._items[i];
                if (item) {
                    item._id = generateMongoId();
                    item.parentId = newItem._id;
                    InventoryService.addItemToInventory(bot, item);
                    allItems.push(item);
                }
            }
        }

        if (slotId === "Holster") {
            newItem.upd = {
                "Repairable": {
                    "Durability": this.randomInteger(50, 90),
                    "MaxDurability": this.randomInteger(91, 99),
                },
                "FireMode": {
                    "FireMode": "single"
                }
            }

            // const cartridges = DatabaseService.getDatabase().getTemplateItemsByCategory("cartridges");
            // InventoryService.addItemToInventory(bot, item);
            const templateItem = DatabaseService.getDatabase().getTemplateItemById(newItem._tpl);
            const ammoCaliber = templateItem._props.ammoCaliber;
            if (ammoCaliber) {
                const templatesItems = DatabaseService.getDatabase().getTemplateItemsAsArray();
                const ammos = templatesItems.filter(x => x._props.ammoType === "bullet" && x._props.Caliber == ammoCaliber && x._props.Damage > 0);
                if (ammos.length > 0) {
                    const magazine = allItems.find(x => x.slotId == "mod_magazine");
                    if (magazine) {
                        const magazineTemplate = DatabaseService.getDatabase().getTemplateItemById(magazine._tpl);
                        if (magazine && magazineTemplate._props.Cartridges && magazineTemplate._props.Cartridges.length > 0) {
                            const randomAmmo = 
                                {
                                    _tpl: ammos[this.randomInteger(0, ammos.length-1)]._id,
                                    _id: generateMongoId(),
                                    parentId: magazine._id,
                                    slotId: "cartridges",
                                    upd: {
                                        "StackObjectsCount": magazineTemplate._props.Cartridges[0]._max_count,
                                        "SpawnedInSession": false
                                    }
                                }
                            InventoryService.addItemToInventory(bot, randomAmmo);
                        }
                    }
                }
            }
        }


        return newItem;
    }


    /**
     * 
     * @param {BotGenerationCondition} condition 
     * @param {AccountProfileCharacter} bot 
     * @returns 
     */
    addBackpack(condition, bot) {

        let backpackChance = 69;
        switch(condition.Role) {
            case "marksman":
                backpackChance = 0;
                break;
            case "pmcUSEC":
            case "pmcBEAR":
                backpackChance = 96;
                break;
        }

        // if the backpackChance is under the random number, do not generate the backpack
        const randomChance = this.randomInteger(1, 99);
        if(backpackChance < randomChance)
            return;

        const lowestPrice = this.availableBackpacks[0].p;
        const highestPrice = this.availableBackpacks[this.availableBackpacks.length-1].p;
        let randomPrice = this.randomInteger(lowestPrice * 0.7, highestPrice * 0.75);
        switch(condition.Role) {
            case "pmcUSEC":
            case "pmcBEAR":
                randomPrice *= 1.15;
                break;
        }
        const filteredBackpacks = this.availableBackpacks.filter(x => x.p <= randomPrice);
        if (filteredBackpacks.length === 0)
            return;

        const chosenBackpack = filteredBackpacks[this.randomInteger(0, filteredBackpacks.length-1)];
        // Add a new Backpack (by chance)
        InventoryService.addTemplatedItemToSlot(bot, chosenBackpack.item, "Backpack");

    }

    /**
     * 
     * @param {AccountProfileCharacter} bot 
     * @returns 
     */
    addDogtag(bot) {

        if (bot.Info.Side === "Savage")
            return;

        bot.Inventory.items.push({
            _id: generateMongoId(),
            _tpl: bot.Info.Side === "Usec" ? "59f32c3b86f77472a31742f0" : "59f32bb586f774757e1e8442",
            parentId: bot.Inventory.equipment,
            slotId: "Dogtag",
            upd: {
            Dogtag: {
                AccountId: bot.aid,
                ProfileId: bot._id,
                Nickname: bot.Info.Nickname,
                Side: bot.Info.Side,
                Level: bot.Info.Level,
                Time: new Date().toISOString(),
                Status: "Killed by ",
                KillerAccountId: "Unknown",
                KillerProfileId: "Unknown",
                KillerName: "Unknown",
                WeaponName: "Unknown",
            },
            },
        });

        return bot;
    }

    /**
     * Adds a random level to the PMC characters
     * @param {AccountProfileCharacter} bot 
     * @returns 
     */
    generateBotLevel(bot) {
        if (bot.Info.Side === "Savage")
            return;

        // TODO: Make this more dynamic to the Accounts on the Server
        let level = this.randomInteger(1, 50);
        let xp = this.getNeededXPFromLvl(level); 
        // console.log("XP: ", xp);
        bot.Info.Experience = this.getNeededXPFromLvl(level);
        bot.Info.Level = level;

    }

    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 
     * @param {Number} level
     * @returns {Number} 
     */
    getNeededXPFromLvl(level) {
        const globalsResult = Database.getData(Database["globals"]);
        const xpTable = globalsResult.config.exp.level.exp_table;
       
        let exp = 0; 
        for (let i = 0; i < level; i++) {
            exp += xpTable[i].exp;
        }
        return exp;
    }

    /**
     * 
     * @param {Number} xp
     * @returns {Number} 
     */
    convertXPToLevel(xp) {
        const globalsResult = Database.getData(Database["globals"]);
        /**
         * @type {Array}
         */
        const xpTable = globalsResult.config.exp.level.exp_table;
       
        const resultXP = xpTable.find(x => x == xp);
        return resultXP;
    }

}



module.exports.BotGenerationService = new BotGenerationService();
