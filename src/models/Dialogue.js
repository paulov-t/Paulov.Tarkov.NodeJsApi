const { mongoid } = require('mongoid-js');
const { MessageType, EMessageType } = require('./Enums/EMessageType');
const { Message } = require('./Message');

class Dialogue {
    constructor(idOfTraderOrPlayer) {

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
         * @type {Array<UpdatableChatMember>}
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
         * @description Unique identifier of player or trader for the dialogue 
         */
        this._id = idOfTraderOrPlayer;
    }
}

module.exports.Dialogue = Dialogue;