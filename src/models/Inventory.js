class Inventory {
    constructor() {
        /**
         * @type {String}
         */
        this.equipment = "";
        /**
         * @type {Object[]}
         */
        this.items = [];
         /**
         * @type {String}
         */
         this.questRaidItems = "6613bb72b5b0ba138a0fab08";

          /**
         * @type {String}
         */
        this.sortingTable = "6613bb72b5b0ba138a0fab0a";
    }
}

module.exports.Inventory = Inventory;