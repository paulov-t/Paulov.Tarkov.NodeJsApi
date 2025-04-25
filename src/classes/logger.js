"use strict";
const colorData = [
  {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },
  {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
];

class Logger {
  constructor() {
  }

  log(type, data, colorFront = "", colorBack = "") {

    const LoggingService = require("../services/LoggingService");
    LoggingService.log(data);

    
    let setColors = "";
    let colors = ["", ""];

    if (colorFront !== "") {
      colors[0] = colorFront;
    }

    if (colorBack !== "") {
      colors[1] = colorBack;
    }

    // properly set colorString indicator
    for (let i = 0; i < colors.length; i++) {
      if (colors[i] !== "") {
        setColors += colorData[i][colors[i]];
      }
    }

    let date = new Date().toISOString().
      replace(/T/, ' ').
      replace(/\..+/, '');

    let deltaTime = false ? "[" + date + "] " : " ";

    // print data
    if (colors[0] !== "" || colors[1] !== "") {
      if (type != "" && type != "LogData") 
        console.log(setColors + type + "\x1b[0m" + deltaTime + data);
      else 
        console.log(setColors + data + "\x1b[0m");
    } else {
      if (type != "" && type != "LogData") 
        console.log(`${type} ${deltaTime} ${data !== undefined ? data : ""}`);
      else 
        console.log(data);
    }
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

module.exports.logger = new Logger();