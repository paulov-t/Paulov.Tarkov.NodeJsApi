const { EServerStatus } = require("./EServerStatus");

class ServerItem {
    constructor(ip, port, status = EServerStatus.Offline) {
        this.ip = ip;
        this.port = port;
        /**
         * @type {EServerStatus}
         */
        this.status = status;
        /**
         * @type {number}
         * @description Last time the server was updated
         */
        this.lastUpdate = Date.now();    


        /**
         * @type {Array<string>}
         * @description List of players who have matchmaked to the server
         */
        this.players = [];
    }
}

module.exports = ServerItem;