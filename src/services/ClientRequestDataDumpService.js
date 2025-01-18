var fs = require('fs');
var path = require('path');

/**
 * A service that will dump client request into a file
 */
class ClientRequestDataDumpService {
    constructor() {
       this.requestDataDumpDirectoryPath = path.join(__dirname, "../", "./data/dumps/client");
       fs.mkdirSync(this.requestDataDumpDirectoryPath, { recursive: true });
    }

    /**
     * 
     * @param {object} name 
     * @param {object} data 
     */
    dumpData(name, data) {
       fs.writeFileSync(path.join(this.requestDataDumpDirectoryPath, `${name}.json`), JSON.stringify(data, null, "\t"));
    }
}

module.exports.ClientRequestDataDumpService = new ClientRequestDataDumpService();