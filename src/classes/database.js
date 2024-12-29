var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');

class Database {
    constructor() {
        this.bots = {};
        this.core = {};
        this.customization = {};
        this.gameplay = {};
        this.globals = {};
        this.hideout = {};
        this.items = {};
        this.itemPriceTable = {};
        this.quests = []; // Note Array
        this.repeatableQuests = [];
        this.languages = {};
        this.locales = {};
        this.locations = {};
        this.traders = {};
        this.weather = [];
    }
}
/**
 * 
 */
global._database = new Database();

async function readZipArchive(filepath) {
    try {
      const zip = new AdmZip(filepath);
  
      for (const zipEntry of zip.getEntries()) {
        // console.log(zipEntry.toString());

        if(zipEntry.name.length > 0) {
            // Remove "database"
            let dbPath = zipEntry.entryName.replace("database", "");
            dbPath = dbPath.substring(1, dbPath.length);
            const lastIndexOfSlash = dbPath.lastIndexOf('/');
            dbPath = dbPath.substring(0, lastIndexOfSlash);

            if(global._database[dbPath] === undefined)
                global._database[dbPath] = {};

            const decodedJsonObject = zipEntry.getData().toString('utf8')

            const dbEntryName = zipEntry.name.replace(".json", "");
            global._database[dbPath][dbEntryName] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
        }
      }
    } catch (e) {
      console.log(`Something went wrong. ${e}`);
    }
  }

async function loadCompressedDatabase() {
    let dbFilePath = path.resolve(process.cwd(), "./data/database.zip");
    await readZipArchive(dbFilePath);
    console.log("loading database...");
    console.log(global._database);
    console.log("loaded database!");

}

module.exports.db
exports.loadCompressedDatabase = loadCompressedDatabase;