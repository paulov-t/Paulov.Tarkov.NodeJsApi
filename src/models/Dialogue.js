const { mongoid } = require('mongoid-js');
const { MessageType, EMessageType } = require('./Enums/EMessageType');
const { Message } = require('./Message');

class Dialogue {
    constructor() {

        /**
         * 
         */
        this.attachmentsNew = 0;
        this.new = 0;
        /**
         * @type {EMessageType}
         */
        this.type = EMessageType.UserMessage;
        /**
         * @type {Array}
         */
        this.Users = [];
        /**
         * @type {boolean}
         */
        this.pinned = false;
        /**
         * @type {Array<Message>}
         */
        this.messages = [];

        /**
         * @type {String}   
         */
        this._id = mongoid();
    }
}

module.exports.Dialogue = Dialogue;