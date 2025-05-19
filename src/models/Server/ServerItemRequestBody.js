class ServerItemRequestBody {
    constructor(localIP, externalIP, port) {
        this.localIP = localIP;
        this.externalIP = externalIP;
        this.port = port;
    }
}

module.exports = ServerItemRequestBody;