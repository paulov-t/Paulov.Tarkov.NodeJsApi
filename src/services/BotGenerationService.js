const { generateMongoId } = require("../bsgHelper");
const { logger } = require("../classes/logger");
const { AccountProfileCharacter } = require("../models/Account");
const { BotGenerationCondition } = require("../models/BotGenerationCondition");
const fs = require("fs");
const path = require("path");
const { InventoryService } = require("./InventoryService");
const { Database } = require("../classes/database");

/**
 * A service to generate bots for a player scav or raids
 */
class BotGenerationService {
    constructor() {
        /**
         * @type {AccountProfileCharacter}
         */
        this.baseBot = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString()).scav;
    }

    generateAllBots() {
        
    }

    /**
     * Generates a bot based on the conditions provided
     * @param {BotGenerationCondition} condition use { Role: 'playerscav', playerProfileName: 'Name' } for generating a player scav
     * @returns 
     */
    generateBot(condition) {

        const startTime = Date.now();

        if(condition.Role === 'playerscav') {
            condition.Role = 'assault';
        }

        /**
         * @type {AccountProfileCharacter}
         */
        // const bot = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString()).scav;
        const bot = JSON.parse(JSON.stringify(this.baseBot));
        bot._id = generateMongoId();
        bot.aid = generateMongoId();
        bot.Info.Side = condition.Role.includes("pmcBEAR") ? "Bear" : condition.Role.includes("pmcUSEC") ? "Usec" : "Savage";

        // Determine bot difficulty from condition
        if (condition.Difficulty)
            bot.Info.Settings.BotDifficulty = condition.Difficulty;

        if(bot.Info.Side != "Savage") 
            logger.logInfo(`Generating ${condition.Role} on ${bot.Info.Side}`);

        // Update if a playerScav to the player's name
        bot.Info.MainProfileNickname = undefined;
        if (condition.playerProfileName)
            bot.Info.MainProfileNickname = condition.playerProfileName;


        // console.log(Database);

        const lowerRole = condition.Role.toLowerCase();
        // console.log(condition.Role);
        // console.log(Database.bots);
        // console.log(Database.bots.types[lowerRole]);
        const botDatabaseData = Database.getData(Database.bots.types[lowerRole]);
        // console.log(botDatabaseData);

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
        if (botDatabaseData.lastName.length > 0)
            bot.Info.Nickname = bot.Info.Nickname + " " + botDatabaseData.lastName[this.randomInteger(0, botDatabaseData.firstName.length-1)];

        // Generate the bot's level (if PMC)
        this.generateBotLevel(bot);

        // Generate the bot's inventory

        // Remove the Pocket 1
        InventoryService.removeItemFromSlot(bot, "pocket1");
        if (bot.Info.Side !== "Savage") {
            // Add Army bandage
            const pocket1Item = InventoryService.addTemplatedItemToSlot(bot, "5751a25924597722c463c472", "pocket1");
            pocket1Item.location = { 
                x: 0
                , y: 0
                , r: 0
                , "isSearched": false };
        }

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
        if (Object.keys(botDatabaseData.inventory.equipment.Headwear).length === 1) {
            const firstKey = Object.keys(botDatabaseData.inventory.equipment.Headwear)[0];
            InventoryService.addTemplatedItemToSlot(bot, firstKey, "Headwear");
        }

        // Remove the Eyewear
        InventoryService.removeItemFromSlot(bot, "Eyewear");

        // Remove the FaceCover
        InventoryService.removeItemFromSlot(bot, "FaceCover");
        if (Object.keys(botDatabaseData.inventory.equipment.FaceCover).length > 0) {
            const randomFacecoverId = Object.keys(botDatabaseData.inventory.equipment.FaceCover)[this.randomInteger(0, Object.keys(botDatabaseData.inventory.equipment.FaceCover).length)];
            InventoryService.addTemplatedItemToSlot(bot, randomFacecoverId, "FaceCover");
        }

        if (bot.Info.Side !== "Savage")
            this.addDogtag(bot);

        // Fix the Ids of the inventory
        InventoryService.updateInventoryEquipmentId(bot);
        bot.Inventory.items = InventoryService.replaceIDs(bot.Inventory.items, bot, undefined, undefined);
        

        const endTime = Date.now()
        console.log(`${endTime - startTime}ms`);

        return bot;
    }

    /**
     * 
     * @param {BotGenerationCondition} condition 
     * @param {AccountProfileCharacter} bot 
     * @returns 
     */
    addBackpack(condition, bot) {

        const startTime = Date.now();
       
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
        // console.log(`${backpackChance} : ${randomChance}`);
        if(backpackChance < randomChance)
            return;

        const availableBackpacks = InventoryService
            .getAllAvailableBackpacks()
            // .filter(x => Database.getTemplateItemPrice(x._id))
            .map(x => ({ item: x, p: Database.getTemplateItemPrice(x._id) }))
            .sort((a, b) => { return a.p < b.p ? -1 : 1 });
        
        const lowestPrice = availableBackpacks[0].p;
        const highestPrice = availableBackpacks[availableBackpacks.length-1].p;
        let randomPrice = this.randomInteger(lowestPrice * 0.7, highestPrice * 0.75);
        switch(condition.Role) {
            case "pmcUSEC":
            case "pmcBEAR":
                randomPrice *= 1.15;
                break;
        }
        // console.log(randomPrice);
        const filteredBackpacks = availableBackpacks.filter(x => x.p <= randomPrice);
        if (filteredBackpacks.length === 0)
            return;

        const chosenBackpack = filteredBackpacks[this.randomInteger(0, filteredBackpacks.length-1)];
        // Add a new Backpack (by chance)
        // console.log(chosenBackpack);
        InventoryService.addTemplatedItemToSlot(bot, chosenBackpack.item._id, "Backpack");


        const endTime = Date.now();
        console.log(`addBackpack: ${endTime - startTime}ms`);

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
        // bot.Info.Level = this.randomInteger(1, 50);
        // bot.Info.Experience = this.getNeededXPFromLvl(bot.Info.Level);

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
       
        return xpTable[level];
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
