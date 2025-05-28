const { mongoid } = require("mongoid-js");
const { ENotificationType } = require("./ENotificationType");
const { ProfileChangeEvent } = require("./ProfileChangeEvent");
const { SystemData } = require("./SystemData");
const { UpdatableChatMember } = require("./UpdatableChatMember");
const { EMessageType } = require("./Enums/EMessageType");
const { MessageItemsModel } = require("./MessageItemsModel");


class Message {
    constructor(idOfTraderOrPlayer) {
        /**
         * @type {string}
         */
        this._id = mongoid();
        /**
         * @type {string}
         */
        this.uid = idOfTraderOrPlayer;
        /**
         * @type {EMessageType}
         */
        this.type = EMessageType.UserMessage;
        /**
         * @type {Number}
         */
        this.dt = 0;
        /**
         * @type {Number}
         */
        this.UtcDateTime;
         /**
         * @type {UpdatableChatMember}
         */
        this.Member = undefined;
        /**
         * @type {string}
         */
        this.templateId = "";
        /**
         * @type {string}
         */
        this.text = "";
        /**
         * @type {Message}
         */
        this.replyTo = undefined;
        /**
         * @type {boolean}
         */
        this.hasRewards = false;
        /**
         * @type {boolean}
         */
        this.rewardCollected = false;
        /**
         * @type {MessageItemsModel}
         */
        this.items = new MessageItemsModel(idOfTraderOrPlayer, []);
        /**
         * @type {Number}
         */
        this.maxStorageTime = 0;
        /**
         * @type {SystemData}
         */
        this.systemData = new SystemData();
        /**
         * @type {Array<ProfileChangeEvent>}
         */
        this.profileChangeEvents = [];
    }
}

module.exports.Message = Message;