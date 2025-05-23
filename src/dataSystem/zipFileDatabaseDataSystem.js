var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');

class ZipFileDatabaseDataSystem {
    constructor() {
        this.templates = {};
        this.traders = {};
        this.zip = undefined;
        this.databaseFilePath = "";
        this.initialised = false;
        this.database = {};

        /**
         * Cached database items. Try to avoid doing this unless necessary for performance!
         */
        this.cached = {
          "templates": [],
          "templatesByParentId": {}
        }
    }

    readZipArchiveIntoMemory(filepath) {
      try {
    
        if(!fs.existsSync(filepath))
          return;
    
        this.zip = new AdmZip(filepath);
    
        const entries = this.zip.getEntries();
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
    
              if(this.database[dbPath] === undefined)
                  this.database[dbPath] = {};
    
              const decodedJsonObject = zipEntry.getData().toString('utf8')
    
              if (dbPath.includes("/")) {
    
                const dbPathSplit = dbPath.split('/');
                if (dbPathSplit.length > 0) {
                  if (this.database[dbPathSplit[0]] === undefined)
                    this.database[dbPathSplit[0]] = {};
    
                  if (this.database[dbPathSplit[0]][dbPathSplit[1]] === undefined)
                    this.database[dbPathSplit[0]][dbPathSplit[1]] = {};
    
                  this.database[dbPathSplit[0]][dbPathSplit[1]][dbEntryName] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
    
                }
              }
    
              if(dbEntryName !== dbPath)
                this.database[dbPath][dbEntryName] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
              else
                this.database[dbPath] = decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
            }
        }
      } catch (e) {
        console.log(`Database could not be loaded with error: ${e}`);
      }
    }

    readZipArchiveDatabaseIntoDbEntryNames(filepath) {
      try {
    
        if(!fs.existsSync(filepath))
          return;
    
        this.zip = new AdmZip(filepath);
    
        const entries = this.zip.getEntries();
        for (const zipEntry of entries) {
    
          if(zipEntry.name.length > 0) {
            const entryNameWithoutDatabase = zipEntry.entryName.replace("database", "");
              // Remove "database"
              let dbPath = entryNameWithoutDatabase.replace("database", "");
              dbPath = dbPath.substring(1, dbPath.length);
    
              const dbEntryName = zipEntry.name.replace(".json", "");
    
              const lastIndexOfSlash = dbPath.lastIndexOf('/');
              if(lastIndexOfSlash !== -1)
                dbPath = dbPath.substring(0, lastIndexOfSlash);
    
              dbPath = dbPath.replace(".json", "");
    
              if(this.database[dbPath] === undefined)
                  this.database[dbPath] = {};
    
              // const decodedJsonObject = zipEntry.getData().toString('utf8')
    
              if (dbPath.includes("/")) {
    
                const dbPathSplit = dbPath.split('/');
                if (dbPathSplit.length > 0) {
                  if (this.database[dbPathSplit[0]] === undefined)
                    this.database[dbPathSplit[0]] = {};
    
                  if (this.database[dbPathSplit[0]][dbPathSplit[1]] === undefined)
                    this.database[dbPathSplit[0]][dbPathSplit[1]] = {};
    
                  this.database[dbPathSplit[0]][dbPathSplit[1]][dbEntryName]  = zipEntry.entryName;//decodedJsonObject.startsWith("{") || decodedJsonObject.startsWith("[") ? JSON.parse(decodedJsonObject) : null;
    
                }
              }
    
              if(dbEntryName !== dbPath)
                this.database[dbPath][dbEntryName] = zipEntry.entryName;
              else
                this.database[dbPath] = zipEntry.entryName;
            }
        }
      } catch (e) {
        console.error(`Database could not be loaded with error: ${e}`);
      }
    }

    /**
     * Given the entryName retrieve the parsed Json object from the Database
     * @param {String} entryName string of the entry to get e.g. database/templates/handbook.json
     * @returns {object} Parsed Json from the entry
     */
    getData(entryName) {
      const entry = this.zip.getEntries().find(x => x.entryName == entryName);
      if (!entry)
        throw `Unable to find entry ${entryName} in Database`;

      const bufferData = entry.getData();
      if (!bufferData)
        throw `Unable to get data from entry ${entryName}`;
      
      return JSON.parse(bufferData.toString('utf8'));
    }

    loadCompressedDatabase() {

      if(this.initialised === true)
        return;

      let dbFilePath = path.join(__dirname, "../", "./data/database.zip");
      console.log("loading database...");
      // this.readZipArchiveIntoMemory(dbFilePath);
      this.databaseFilePath = dbFilePath;
      this.readZipArchiveDatabaseIntoDbEntryNames(dbFilePath);
      console.log("loaded database!");
      this.initialised = true;
    
    }

    /**
     * 
     * @returns 
     */
    getGlobals() {
        const db = this.database;
        const dbResult = db.getData(db["globals"]);
        return dbResult;
    }


    /**
     * 
     * @returns 
     */
    getTemplateItems() {
        const db = this.database;
        const dbResult = db.getData(db["templates"]["items"]);
        this.cacheTemplatesByParentId(dbResult);
        return dbResult;
    }

    getTemplateItemById(templateId) {

      if(this.cached.templates.length > 0) {
        const item = this.cached.templates.find(x => x._id === templateId);
        if(item !== undefined)
          return item;
      }

      const db = this.database;
      const dbResult = db.getData(db["templates"]["items"]);
      if (dbResult[templateId] === undefined)
        return null;

      return dbResult[templateId];
    }

    /**
     * 
     * @returns 
     */
    getTemplateItemsAsArray() {
      
      if(this.cached.templates.length > 0) 
        return this.cached.templates;

      const db = this.database;
      const dbResult = db.getData(db["templates"]["items"]);
      for(const id in dbResult) {
        const item = dbResult[id];
        this.cached.templates.push(item);
      }
      this.cacheTemplatesByParentId(dbResult);

      return this.cached.templates;
  }

  cacheTemplatesByParentId(dbResult) {
    for(const id in dbResult) {
      const item = dbResult[id];

      if(this.cached.templates.findIndex(x => x._id === id) === -1)
        this.cached.templates.push(item);

      if (item._parent === '') 
        continue;

      if (this.cached.templatesByParentId[item._parent] === undefined)
        this.cached.templatesByParentId[item._parent] = []

      if(this.cached.templatesByParentId[item._parent].findIndex(x => x === id) === -1)
        this.cached.templatesByParentId[item._parent].push(id);
    }
  }

    /**
     * 
     * @param {String} templateId  
     * @returns {Number}
     */
    getTemplateItemPrice(templateId) {
      const db = this.database;
      const dbResultData = db.getData(db["templates"]["prices"]);
      let resultPrice = dbResultData[templateId];
      if (!resultPrice || resultPrice == NaN)
        resultPrice = 0;

      return resultPrice;
  }

  /**
     * 
     * @param {String} templateId  
     * @returns {Number}
     */
  getTemplatePrice(templateId) {
    return this.getTemplateItemPrice(templateId);
}

  /**
     * 
     * @returns {Object} Dictionary<string, object>
     */
  getTemplateQuests() {
    this.loadCompressedDatabase();
    const db = this.database;
    const dbResult = db.getData(db["templates"]["quests"]);
    return dbResult;
  }

  getItemPresetArrayByEncyclopedia(filterByEncyclopediaTpl, properties) {

    // If we have not loaded the database yet, do it now
    this.loadCompressedDatabase();

    let dbResult = Object.values(this.getData(this["globals"])["ItemPresets"]);
    dbResult = dbResult.filter(x => x._encyclopedia === filterByEncyclopediaTpl);
    if (dbResult.length === 0)
      return [];

    // If we have defined properties
    if (properties) {
      const selectResult = [];
      for(const item of dbResult) {
        var propertyResult = {};
        properties.forEach((key) => {
          item[key] && (propertyResult[key] = item[key]);
        });
        selectResult.push(propertyResult);
      }
      return selectResult;
    }
    return dbResult;
  }
}

module.exports.ZipFileDatabaseDataSystem = new ZipFileDatabaseDataSystem();