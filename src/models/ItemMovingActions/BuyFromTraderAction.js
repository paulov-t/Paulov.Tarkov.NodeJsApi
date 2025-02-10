class BuyFromTraderAction {
    constructor() {

        this.count = 0;

        /**
         * This is the Item Id
         * @type {String}
         */
        this.item_id = '';

        /**
         * This is the Trader Id
         * @type {String}
         */
        this.tid = '';

        /**
         * This is the item Ids from the player
         * @type {BuyFromTraderActionSchemeItem[]}
         */
        this.scheme_items = [];
    }
}

class BuyFromTraderActionSchemeItem {
    constructor() {

        this.id = '';
        this.count = 0;

    }
}

module.exports.BuyFromTraderAction = BuyFromTraderAction;
module.exports.BuyFromTraderActionSchemeItem = BuyFromTraderActionSchemeItem;