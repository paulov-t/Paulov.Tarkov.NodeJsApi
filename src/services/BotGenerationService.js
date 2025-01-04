const { generateMongoId } = require("../bsgHelper");
const { AccountProfileCharacter } = require("../models/Account");
const fs = require("fs");
const path = require("path");

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
