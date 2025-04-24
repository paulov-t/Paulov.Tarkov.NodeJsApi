class LoggingHistoryEntry {
    constructor(date, time, text) {
        this.date = date; // Expected format: YYYY-MM-DD
        this.time = time; // Expected format: HH:mm:ss
        this.text = text; // Log message text
    }

    // Method to display the log entry as a formatted string
    toString() {
        return `[${this.date} ${this.time}] ${this.text}`;
    }
}

module.exports.LoggingHistoryEntry = LoggingHistoryEntry;