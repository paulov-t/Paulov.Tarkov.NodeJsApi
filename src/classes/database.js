var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');

class Database {
    constructor() {
        // this.bots = {};
        // this.core = {};
        // this.customization = {};
        // this.gameplay = {};
        // this.globals = {};
        // this.hideout = {};
        // this.items = {};
        // this.itemPriceTable = {};
        // this.quests = []; // Note Array
        // this.repeatableQuests = [];
        // this.languages = {};
        // this.locales = {};
        // this.locations = {};
        // this.traders = {};
        // this.weather = [];

        this.initialised = false;
    }

    readZipArchive(filepath) {
      try {
    
        if(!fs.existsSync(filepath))
          return;
    
        const zip = new AdmZip(filepath);
    
        const entries = zip.getEntries();
        for (const zipEntry of entries) {
    
          if(zipEntry.name.length > 0) {
              // Remove "database"
              let dbPath = zipEntry.entryName.replace("database", "");
              dbPath = dbPath.substring(1, dbPath.length);
    
              const dbEntryName = zipEntry.name.replace(".json", "");
    
              const lastIndexOfSlash = dbPath.lastIndexOf('/');
              if(lastIndexOfSlash !== -1)
                dbPath = dbPath.substring(0, lastIndexOfSlash);
    
              dbPath = dbPath.replace(".json", "");
    
              if(global._database[dbPath] === undefined)
                  global._database[dbPath] = {};
    
              const decodedJsonObject = zipEntry.getData().toString('utf8')
    
              if (dbPath.includes("/")) {
    
                const dbPathSplit = dbPath.split('/');
                if (dbPathSplit.length > 0) {
                  if (global._database[dbPathSplit[0]] === undefined)
                    global._database[dbPathSplit[0]] = {};
    
                  if (global._database[dbPathSplit[0]][dbPathSplit[1]] === undefined)
                    global._database[dbPathSplit[0]][dbPathSplit[1]] = {};
    
                  global._database[dbPathSplit[0]][dbPathSplit[1]][dbEntryName] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
    
                }
              }
    
              if(dbEntryName !== dbPath)
                global._database[dbPath][dbEntryName] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
              else
                global._database[dbPath] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
            }
        }
      } catch (e) {
        console.log(`Database could not be loaded with error: ${e}`);
      }
    }
    
    loadCompressedDatabase() {

      if(this.initialised === true)
        return;

      let dbFilePath = path.join(__dirname, "../", "./data/database.zip");
      console.log("loading database...");
      // this.readZipArchive(dbFilePath);
      // console.log(global._database);
      console.log("loaded database!");
      this.initialised = true;
    
    }
}
/**
 * @type {Database}
 */
global._database = new Database();

module.exports.db = global._database;
module.exports.database = new Database();
module.exports.database.loadCompressedDatabase = module.exports.database.loadCompressedDatabase;