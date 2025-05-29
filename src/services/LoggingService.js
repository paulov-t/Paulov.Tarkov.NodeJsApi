const { LoggingHistoryEntry } = require('../models/LoggingHistoryEntry.js'); 


class LoggingService {
    constructor() {
        if (LoggingService.instance) {
            return LoggingService.instance;
        }

        /**
         * @type {LoggingHistoryEntry[]}
         * @description Array to store log history entries. 
         */
        this.logHistory = [];
        LoggingService.instance = this;
    }

    log(message) {
        if (typeof message !== 'string') {
            throw new Error('Log message must be a string');
        }
        if (message.length > 1000) {
            message = message.substring(0, 1000) + '...';
        }

        console.log(message);

        const dateOnly = new Date().toISOString().split('T')[0];
        const timeOnly = new Date().toISOString().split('T')[1].split('.')[0];

        const logHistoryEntry = new LoggingHistoryEntry(dateOnly, timeOnly, message); 
        this.logHistory.push(logHistoryEntry);
    }

    getHistoryAll() {
        return this.logHistory;
    }

    getHistoryFromToday() {
        return this.logHistory.filter(entry => {
            const entryDate = entry.date;
            const today = new Date().toISOString().split('T')[0];
            return entryDate === today;
        });
    }

    clearHistory() {
        this.logHistory = [];
    }

    logError(text) {
        this.log(`[ERROR]:${text}`);
    }

    logWarning(text) {
        this.log(`[WARNING]:${text}`);
    }

    logSuccess(text) {
        this.log(`[SUCCESS]:${text}`);
    }

    logDebug(text, isStructData = false) {
      
    }

    logInfo(text) {
        this.log(`[INFO]:${text}`);
    }
    logDebug(text) {
        this.log(`[DEBUG]:${text}`);
    }

    logRequest(text, data = "") {
    }

    logData(data, deep = false) {
        if (deep) data = internal.util.inspect(data, { showHidden: false, depth: null });
        this.log("LogData", data);
    }

    throwErr(message, where, additional = "") {
        throw message + "\r\n" + where + (additional != "" ? `\r\n${additional}` : "");
    }
}

const instance = new LoggingService();
Object.freeze(instance);

module.exports = instance;