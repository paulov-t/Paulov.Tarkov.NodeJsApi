const { Database } = require('./../classes/database');

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
}

module.exports.DatabaseService = new DatabaseService();