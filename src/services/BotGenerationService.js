const { generateMongoId } = require("../bsgHelper");
const { logger } = require("../classes/logger");
const { AccountProfileCharacter } = require("../models/Account");
const fs = require("fs");
const path = require("path");
const { InventoryService } = require("./InventoryService");
const { Database } = require("../classes/database");

class BotGenerationService {
    constructor() {

    }

    /**
     * 
     * @param {BotGenerationCondition} condition 
     * @returns 
     */
    generateBot(condition) {

        /**
         * @type {AccountProfileCharacter}
         */
        const bot = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "scav.json")).toString()).scav;
        bot._id = generateMongoId();
        bot.aid = generateMongoId();
        bot.Info.Side = condition.Role.includes("pmcBEAR") ? "Bear" : condition.Role.includes("pmcUSEC") ? "Usec" : "Savage";
        if(bot.Info.Side != "Savage") {
            logger.logDebug(`Generating ${bot.Info.Side}`);
        }
        bot.Info.MainProfileNickname = undefined;
        // Fix the Ids of the original scav
        InventoryService.updateInventoryEquipmentId(bot);
        bot.Inventory.items = InventoryService.replaceIDs(bot.Inventory.items, bot, undefined, undefined);

        const lowerRole = condition.Role.toLowerCase();
        console.log(condition.Role);
        console.log(Database.bots);
        console.log(Database.bots.types[lowerRole]);
        const botDatabaseData = Database.getData(Database.bots.types[lowerRole]);
        console.log(botDatabaseData);


        bot.Info.Voice = Object.keys(botDatabaseData.appearance.voice)[0];
        
        return bot;
    }
    
}

class BotGenerationCondition {
    constructor() {
        this.Role = "assault";
        this.Limit = 9;
        this.Difficulty = "normal"
    }
}

module.exports.BotGenerationService = new BotGenerationService();
module.exports.BotGenerationCondition = BotGenerationCondition;
