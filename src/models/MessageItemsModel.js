module.exports.MessageItemsModel = class MessageItemsModel {
    
    /**
     * 
     * @param {string} idOfTraderOrPlayer 
     * @param {Array} items 
     */
    constructor(idOfTraderOrPlayer, items) {
        /**
         * @type {String}
         */
        this.stash = idOfTraderOrPlayer;
        /**
         * @type {Array}
         */
        this.data = items;
    }
}