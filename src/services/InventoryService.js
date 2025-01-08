const { AccountProfileCharacter } = require("../models/Account");

class InventoryService {
    constructor() {

    }

    /**
     * 
     * @param {AccountProfileCharacter} profile 
     * @param {String} itemId 
     */
    removeItemAndChildItemsFromProfile(profile, itemId) {
        if (!profile)
            return;

        if (!itemId)
            return;

        const items = profile.Inventory.items;
        const childItems = this.findChildItemsOfItemId(items, itemId);
        childItems.push({ _id: itemId });
        // console.log(childItems);
        for(const item of childItems) {
            const indexOfItem = profile.Inventory.items.findIndex(x => x._id === item._id);
            if (indexOfItem !== -1)
                profile.Inventory.items.splice(indexOfItem, 1);
        }
    }

    /**
     * 
     * @param {Object[]} items 
     * @param {String} itemId 
     * @returns {Object[]} Items
     */
    findChildItemsOfItemId(items, itemId) {
        if (!items)
            return;

        if (!itemId)
            return;

        const childItems = [];
        for(const it of items) {
            if (!it.parentId)
                continue;

            if (it.parentId === itemId) {
                childItems.push(it);
            }
        }

        return childItems;
    }
}

module.exports.InventoryService = new InventoryService();
