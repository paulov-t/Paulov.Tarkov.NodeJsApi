class BuyFromTraderAction {
    /**
     * 
     * @param {Number} count 
     * @param {String} itemId 
     * @param {String} tid 
     * @param {BuyFromTraderActionSchemeItem[]} schemeItems 
     */
    constructor(count = 0, itemId = '', tid = '', schemeItems = []) {

        this.count = count;

        /**
         * This is the Item Id
         * @type {String}
         */
        this.item_id = itemId;

        /**
         * This is the Trader Id
         * @type {String}
         */
        this.tid = tid;

        /**
         * This is the item Ids from the player
         * @type {BuyFromTraderActionSchemeItem[]}
         */
        this.scheme_items = schemeItems;
    }
}

class BuyFromTraderActionSchemeItem {
     /**
     * 
     * @param {Number} count 
     * @param {String} id 
     */
    constructor(id = '', count = 0) {

        this.id = id;
        this.count = count;

    }
}

module.exports.BuyFromTraderAction = BuyFromTraderAction;
module.exports.BuyFromTraderActionSchemeItem = BuyFromTraderActionSchemeItem;