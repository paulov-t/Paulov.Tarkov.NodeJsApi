const { generateMongoId } = require("../bsgHelper");

class BotGenerationService {
    constructor() {

    }

    generateBot(playerData = undefined) {

        if (playerData)
            playerData = JSON.parse(JSON.stringify(playerData));

        const db = global._database;
        const bot = JSON.parse(JSON.stringify(db["bots"]["base"]));
        bot._id = generateMongoId();
        bot.aid = generateMongoId();
        bot.savage = undefined; 
        if (playerData) {

            if(playerData.savage &&  playerData.savage !== '__REPLACEME__')
                bot._id = playerData.savage;

            // bot.aid = playerData.aid;
            bot.Info.SavageLockTime = Math.floor(Date.now() / 1000 + 1);
        }

        if (!bot.Inventory)
            bot.Inventory = {};

        if (!bot.Inventory.items) {
            bot.Inventory.equipment = generateMongoId();
            bot.Inventory.items = [
                {
                    "_id": bot.Inventory.equipment,
                    "_tpl": "55d7217a4bdc2d86028b456d"
                },
                {
                    "_id": generateMongoId(),
                    "_tpl": "673c7b00cbf4b984b5099181"
                }
            ];
        }

        return bot;
    }
    
}

module.exports.BotGenerationService = new BotGenerationService();
