module.exports.Item = class Item {
    /**
     * 
     * @param {Item} item 
     */
    constructor(item) {
        /**
         * @type {string}
         * @property {string} _id - Unique identifier for the item.
         */
        this._id = item._id || item.id;
        /**
         * @type {string}
         * @property {string} _tpl - Template Id for the item.
         */
        this._tpl = item._tpl;
        /**
         * @type {string}
         * @property {string} slotId - Slot for the item.
         */
        this.slotId = item.slotId || item.slot;
        /**
         * @type {string}
         * @property {string} parentId - Parent Unique identifier for the item.
         */
        this.parentId = item.parentId || item.parent;
        /**
         * @type {object}
         * @property {object} upd - Object of information for location etc.
         */
        this.upd = item.upd || {};
          /**
         * @type {Vector2d}
         * @property {Vector2d} upd - Object of information for location etc.
         */
        this.location = item.location || {};
        this.slotType = item.slotType || "hideout";
        this.isActive = item.isActive || false;
        this.isQuestItem = item.isQuestItem || false;
        this.stackObjectsCount = item.stackObjectsCount || 1;
    }
}