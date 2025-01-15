const { generateMongoId } = require("../bsgHelper");
const { logger } = require("../classes/logger");
const { AccountProfileCharacter } = require("../models/Account");
const { BotGenerationCondition } = require("../models/BotGenerationCondition");
const fs = require("fs");
const path = require("path");
const { InventoryService } = require("./InventoryService");
const { Database } = require("../classes/database");

class BotGenerationService {
    constructor() {

    }

    /**
     * 
     * @param {BotGenerationCondition} condition use { Role: 'playerscav', playerProfileName: 'Name' } for generating a player scav
     * @returns 
     */
    generateBot(condition) {

        if(condition.Role === 'playerscav') {
            condition.Role = 'assault';
        }

        /**
         * @type {AccountProfileCharacter}
         */
        const bot = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString()).scav;
        bot._id = generateMongoId();
        bot.aid = generateMongoId();
        bot.Info.Side = condition.Role.includes("pmcBEAR") ? "Bear" : condition.Role.includes("pmcUSEC") ? "Usec" : "Savage";
        if(bot.Info.Side != "Savage") {
            logger.logInfo(`Generating ${condition.Role} on ${bot.Info.Side}`);
        }

        // Update if a playerScav to the player's name
        bot.Info.MainProfileNickname = undefined;
        if (condition.playerProfileName)
            bot.Info.MainProfileNickname = condition.playerProfileName;


        console.log(Database);

        const lowerRole = condition.Role.toLowerCase();
        console.log(condition.Role);
        // console.log(Database.bots);
        // console.log(Database.bots.types[lowerRole]);
        const botDatabaseData = Database.getData(Database.bots.types[lowerRole]);
        console.log(botDatabaseData);

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


        // Generate the bot's inventory

        // Remove the Armband
        InventoryService.removeItemFromSlot(bot, "Armband");

        // Remove the Backpack (and all its items within it)
        InventoryService.removeItemFromSlot(bot, "Backpack");
        // Add a new backpack based on chance
        this.addBackpack(condition, bot);
        
        // Remove the Headwear
        InventoryService.removeItemFromSlot(bot, "Headwear");

        // Remove the Eyewear
        InventoryService.removeItemFromSlot(bot, "Eyewear");

        // Remove the FaceCover
        InventoryService.removeItemFromSlot(bot, "FaceCover");

       

        // Fix the Ids of the inventory
        InventoryService.updateInventoryEquipmentId(bot);
        bot.Inventory.items = InventoryService.replaceIDs(bot.Inventory.items, bot, undefined, undefined);
        
        return bot;
    }

    
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
        // console.log(`${backpackChance} : ${randomChance}`);
        if(backpackChance < randomChance)
            return;

        const availableBackpacks = InventoryService
            .getAllAvailableBackpacks()
            .filter(x => Database.getTemplateItemPrice(x._id))
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
    }

    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}



module.exports.BotGenerationService = new BotGenerationService();
