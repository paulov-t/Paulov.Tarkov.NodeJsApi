const { Database } = require('./../classes/database');

class DatabaseService {

    getDatabase() {
        return Database;
    }
}

module.exports.DatabaseService = new DatabaseService();