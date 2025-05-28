const { Database } = require('./../classes/database');
const LoggingService = require('./LoggingService');

class DatabaseService {

    getDatabase() {
        const db = Database;
        db.loadCompressedDatabase();
        return db;
    }

    getTemplateQuestsAsList() {
        const templateQuests = this.getDatabase().getTemplateQuests();
        const quests = [];
        
        for(const questId in templateQuests) {
            quests.push(templateQuests[questId]);
        }

        return quests;
    }

    /**
     * 
     * @param {String} templateId  
     * @returns {Number}
     */
    getTemplateItemPrice(templateId) {
        const db = global._database;
        const dbResultData = this.getDatabase().getData(this.getDatabase()["templates"]["prices"]);
        let resultPrice = dbResultData[templateId];
        if (!resultPrice || resultPrice == NaN) {
            LoggingService.logWarning(`No price found for templateId: ${templateId}`);
            resultPrice = 0;
        }

        return resultPrice;
    }

    /**
     * 
     * @param {String} templateId  
     * @returns {Number}
     */
    getTemplatePrice(templateId) {
        const price = this.getTemplateItemPrice(templateId);
        return price;
    }

    
}

module.exports.DatabaseService = new DatabaseService();