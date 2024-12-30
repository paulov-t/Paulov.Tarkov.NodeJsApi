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

    const entries = zip.getEntries();
    for (const zipEntry of entries) {

      if (zipEntry.name.includes("globals.json")) {
        console.log("");
      }

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