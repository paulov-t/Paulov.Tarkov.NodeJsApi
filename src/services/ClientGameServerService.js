const { EServerStatus } = require("../models/Server/EServerStatus");
const ServerItem = require("../models/Server/ServerItem");
const ServerItemRequestBody = require("../models/Server/ServerItemRequestBody");

class ClientGameServerService {
  constructor() {
    /**
     * @type {Array<ServerItem>}
     * @description List of game servers
     */
    this.gameServers = [];
  }

  /**
   * 
   * @param {ServerItemRequestBody} serverItemRequestBody
   * @description Adds a server to the list of game servers
   * @returns {void}
   * @example
   */
  startMatchmaking(serverItemRequestBody) {

    // Create a new ServerItem object for the local and external servers 
    const localServer = new ServerItem(serverItemRequestBody.localIP, serverItemRequestBody.port, EServerStatus.Menu);
    const externalServer = new ServerItem(serverItemRequestBody.externalIP, serverItemRequestBody.port, EServerStatus.Menu);

    if (this.gameServers.find(server => server.ip === serverItemRequestBody.localIP)) {
        console.log(`Local server ${serverItemRequestBody.localIP} already exists in the list. Matchmaking...`);
        this.gameServers.find(server => server.ip === serverItemRequestBody.localIP).status = EServerStatus.Matchmaking;
    }
    else {
        console.log(`Adding local server ${serverItemRequestBody.localIP} to the list`);
        this.gameServers.push(localServer);
    }

    if (this.gameServers.find(server => server.ip === serverItemRequestBody.externalIP)) {
        console.log(`External server ${serverItemRequestBody.externalIP} already exists in the list. Matchmaking...`);
        this.gameServers.find(server => server.ip === serverItemRequestBody.externalIP).status = EServerStatus.Matchmaking;
    }
    else {
        console.log(`Adding external server ${serverItemRequestBody.externalIP} to the list`);
        this.gameServers.push(externalServer);
    }

    console.log(this.gameServers);

    return this.gameServers;
    
  }

  joinMatchmakingServer(serverItemRequestBody, sessionId) {
    // Find the server in the list of game servers
    const server = this.gameServers.find(server => server.ip === serverItemRequestBody.localIP || server.ip === serverItemRequestBody.externalIP);

    if (server) {
        console.log(`Joined matchmaking server ${server.ip}`);
        server.players.push(sessionId);
    } else {
        console.log(`Server ${serverItemRequestBody.localIP} not found in the list`);
    }
  }
  
    stopMatchmaking(serverItemRequestBody) {
        // Find the server in the list of game servers
        const server = this.gameServers.find(server => server.ip === serverItemRequestBody.localIP || server.ip === serverItemRequestBody.externalIP);

        if (server) {
            // Update the server status to Offline
            server.status = EServerStatus.Offline;
            console.log(`Stopped matchmaking for server ${server.ip}`);
        } else {
            console.log(`Server ${serverItemRequestBody.localIP} not found in the list`);
        }
    }


}

module.exports.ClientGameServerService = new ClientGameServerService();