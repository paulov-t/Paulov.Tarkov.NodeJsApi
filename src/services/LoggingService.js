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

        const dateOnly = new Date().toISOString().split('T')[0];
        const timeOnly = new Date().toISOString().split('T')[1].split('.')[0];

        const logHistoryEntry = new LoggingHistoryEntry(dateOnly, timeOnly, message); 
        this.logHistory.push(logHistoryEntry);
        // console.log(logHistoryEntry);
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
        if(text.message) {
        this.log("!", text.message, "white", "red");
        }
        else
        this.log("!", text, "white", "red");
    }

    logWarning(text) {
        this.log("!", text, "black", "yellow");
    }

    logSuccess(text) {
        this.log(".", text, "white", "green");
    }

    logDebug(text, isStructData = false) {
        if (isStructData) {
        this.log("[DEBUG]", "Data Output:", "black", "white");
        this.log("LogData", text);
        return;
        }
        this.log("[DEBUG]", text, "black", "white");
    }

    logInfo(text) {
        this.log(".", text, "white", "blue");
    }
    logDebug(text) {
        this.log(".", text, "white");
    }
    logRequest(text, data = "") {
        if (data == "") this.log("", text, "cyan", "black");
        else this.log(data, text, "cyan", "black");
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