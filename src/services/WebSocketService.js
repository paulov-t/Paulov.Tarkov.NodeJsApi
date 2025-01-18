/**
 * A service to retain connections for each user logged in to the App
 */
class WebSocketService {
    constructor() {
        /**
         * 
         */
        this.connections = {};
    }
}

module.exports.WebSocketService = new WebSocketService();
