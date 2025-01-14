const bsgHelper = require('./../bsgHelper');
const { AccountProfileCharacter, Account, AccountProfileMode } = require("../models/Account");
const { logger } = require('../classes/logger');
const { Database } = require('../classes/database');

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
        const equipmentId = profile.Inventory.equipment;
        const childItems = this.findChildItemsOfItemId(items, itemId);
        childItems.push({ _id: itemId });
        for(const item of childItems) {
            // check for equipmentId
            if(item._id === equipmentId)
                continue;
            
            const indexOfItem = profile.Inventory.items.findIndex(x => x._id === item._id);
            if (indexOfItem !== -1)
                profile.Inventory.items.splice(indexOfItem, 1);
        }
    }

     /**
     * Remove's the item and child items from the provided slotId
     * @param {AccountProfileCharacter} profile 
     * @param {String} slotId 
     */
    removeItemFromSlot(profile, slotId) {
        if (!profile)
            return;

        if (!slotId)
            return;

        const items = profile.Inventory.items;
        const item = items.find(x => x.slotId === slotId);
        if (!item)
            return;

        this.removeItemAndChildItemsFromProfile(profile, item._id);
    }

     /**
     * 
     * @param {AccountProfileCharacter} profile 
     * @param {String} templateId 
     * @param {String} slotId 
     */
    addTemplatedItemToSlot(profile, templateId, slotId) {
        if (!profile)
            return;

        if (!templateId)
            return;

        if (!slotId)
            return;

        const templateItems = Database.getTemplateItems();
        const template = templateItems[templateId];
        if (!template)
            return;

        profile.Inventory.items.push(
            {
                "_id": bsgHelper.generateMongoId(),
                "_tpl": templateId,
                "slotId": slotId,
                "parentId": profile.Inventory.equipment
            }
        );

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

    /**
     * TODO: Look into this! Seems overly complicated...
     * Regenerate all GUIDs with new IDs, for the exception of special item types (e.g. quest, sorting table, etc.) This
     * function will not mutate the original items array, but will return a new array with new GUIDs.
     *
     * @param originalItems Items to adjust the IDs of
     * @param pmcData Player profile
     * @param insuredItems Insured items that should not have their IDs replaced
     * @param fastPanel Quick slot panel
     * @returns Item[]
     */
    replaceIDs(
        originalItems,
        pmcData,
        insuredItems,
        fastPanel,
    ) {
        let items = JSON.parse(JSON.stringify((originalItems)));
        let serialisedInventory = JSON.stringify(items);
        const hideoutAreaStashes = Object.values(pmcData?.Inventory.hideoutAreaStashes ?? {});

        for (const item of items) {
            if (pmcData) {
                // Insured items should not be renamed. Only works for PMCs.
                if (insuredItems?.find((insuredItem) => insuredItem.itemId === item._id)) {
                    continue;
                }

                // Do not replace the IDs of specific types of items.
                if (
                    item._id === pmcData.Inventory.equipment ||
                    item._id === pmcData.Inventory.questRaidItems ||
                    item._id === pmcData.Inventory.questStashItems ||
                    item._id === pmcData.Inventory.sortingTable ||
                    item._id === pmcData.Inventory.stash ||
                    item._id === pmcData.Inventory.hideoutCustomizationStashId ||
                    hideoutAreaStashes?.includes(item._id)
                ) {
                    continue;
                }
            }

            // Replace the ID of the item in the serialised inventory using a regular expression.
            const oldId = item._id;
            const newId = bsgHelper.generateMongoId();
            serialisedInventory = serialisedInventory.replace(new RegExp(oldId, "g"), newId);

            // Also replace in quick slot if the old ID exists.
            if (fastPanel) {
                for (const itemSlot in fastPanel) {
                    if (fastPanel[itemSlot] === oldId) {
                        fastPanel[itemSlot] = fastPanel[itemSlot].replace(new RegExp(oldId, "g"), newId);
                    }
                }
            }
        }

        items = JSON.parse(serialisedInventory);

        // fix duplicate id's
        const dupes = {};
        const newParents = {};
        const childrenMapping = {};
        const oldToNewIds = {};

        // Finding duplicate IDs involves scanning the item three times.
        // First scan - Check which ids are duplicated.
        // Second scan - Map parents to items.
        // Third scan - Resolve IDs.
        for (const item of items) {
            dupes[item._id] = (dupes[item._id] || 0) + 1;
        }

        for (const item of items) {
            // register the parents
            if (dupes[item._id] > 1) {
                const newId = bsgHelper.generateMongoId();

                newParents[item.parentId] = newParents[item.parentId] || [];
                newParents[item.parentId].push(item);
                oldToNewIds[item._id] = oldToNewIds[item._id] || [];
                oldToNewIds[item._id].push(newId);
            }
        }

        for (const item of items) {
            if (dupes[item._id] > 1) {
                const oldId = item._id;
                const newId = oldToNewIds[oldId].splice(0, 1)[0];
                item._id = newId;

                // Extract one of the children that's also duplicated.
                if (oldId in newParents && newParents[oldId].length > 0) {
                    childrenMapping[newId] = {};
                    for (const childIndex in newParents[oldId]) {
                        // Make sure we haven't already assigned another duplicate child of
                        // same slot and location to this parent.
                        const childId = this.getChildId(newParents[oldId][childIndex]);

                        if (!(childId in childrenMapping[newId])) {
                            childrenMapping[newId][childId] = 1;
                            newParents[oldId][childIndex].parentId = newId;
                            // Some very fucking sketchy stuff on this childIndex
                            // No clue wth was that childIndex supposed to be, but its not
                            newParents[oldId].splice(Number.parseInt(childIndex), 1);
                        }
                    }
                }
            }
        }

        return items;
    }

    /**
     * 
     * @param {*} item 
     * @returns {String}
     */
    getChildId(item) {
        if (!("location" in item)) {
            return item.slotId;
        }

        return `${item.slotId},${(item.location).x},${(item.location).y}`;
    }

    /**
     * make profiles pmcData.Inventory.equipment unique
     * @param profile Profile to update
     */
    updateInventoryEquipmentId(profile) {
        const oldEquipmentId = profile.Inventory.equipment;
        profile.Inventory.equipment = bsgHelper.generateMongoId();

        for (const item of profile.Inventory.items) {
            if (item.parentId === oldEquipmentId) {
                item.parentId = profile.Inventory.equipment;
                continue;
            }

            if (item._id === oldEquipmentId) {
                item._id = profile.Inventory.equipment;
            }
        }
        // logger.logInfo("Updated equipment Id!");
    }

    getTemplateItem(templateId) {
        return Database.getData(Database.templates.items)[templateId];
    }

    /**
     * 
     * @param {AccountProfileCharacter} accountProfileCharacter 
     * @returns {String} Stash Id
     */
    getPlayerStashId(accountProfileCharacter) {
        let stashId = accountProfileCharacter.Inventory.stash;
        return stashId;
    }

    /**
     * 
     * @param {AccountProfileCharacter} accountProfileCharacter 
     * @returns 
     */
    getPlayerStashSizeXAndY(accountProfileCharacter) {
        let stashId = this.getPlayerStashId(accountProfileCharacter);
        console.log(stashId);
        const stashItemTpl = accountProfileCharacter.Inventory.items.find(x => x._id == stashId)._tpl;
        console.log(Database);
        const templateItems = Database.getData(Database.templates.items);
        const stashItem = templateItems[stashItemTpl];
       
        let stashX = stashItem._props.Grids[0]._props.cellsH !== 0 ? stashItem._props.Grids[0]._props.cellsH : 10;
        let stashY = stashItem._props.Grids[0]._props.cellsV !== 0 ? stashItem._props.Grids[0]._props.cellsV : 66;
        return { x: stashX, y: stashY };
    }

    /**
     * 
     * @param {String} containerId 
     * @param {Object} containerSizeXandY { x , y }
     * @param {Array} currentItems 
     * @param {Object} itemToPlace 
     * @return {Boolean} whether it was possible to place the item 
     */
    placeItemIn2dContainer(containerId, containerSizeXandY, currentItems, itemToPlace) {
        // Create the array as designated by the container size X and Y variables
        // 0 means nothing is in that spot, 1 means there is
        // TODO: Find a way to make this a much more performant 2D UInt8Array instead
        const array2d = this.create2DArray(containerSizeXandY.y, containerSizeXandY.x);
        console.log(array2d);
        // Fill 2D Array with current Items
        for(const item of currentItems) {
            const itemLocation = item.location;
            if (!itemLocation)
                continue;

            if (!item.parentId)
                continue;

            if (item.parentId !== containerId) {
                // Check if child item of another item here
                continue;
            }

            // The specified spot is filled. This has not handled size yet...
            array2d[itemLocation.y][itemLocation.x] = 1;
            console.log(item);
        }

        return false;
    }

    create2DArray(rows, columns) {
        const array = [];
        for (let i = 0; i < rows; i++) {
            array[i] = [];
            for (let j = 0; j < columns; j++) {
                array[i][j] = 0; // Initialize with zeros
            }
        }
        return array;
    }


    getAllAvailableBackpacks() {
        const backpackParentId = "5448e53e4bdc2d60728b4567";
        const list = this.getAllAvailableItemOptionsByParentId(backpackParentId);
        return list;
    }

    getAllAvailableItemOptionsByParentId(parentId) {
        const templateItems = Database.getTemplateItems();

        const list = [];
        for(const itemId in templateItems) {
            const template = templateItems[itemId];
            if (template._parent === parentId) {
                list.push(template);
            }
        }
        return list;
    }

}

module.exports.InventoryService = new InventoryService();
