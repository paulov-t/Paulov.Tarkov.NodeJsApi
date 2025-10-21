const bsgHelper = require('./../bsgHelper');
const { AccountProfileCharacter, Account, AccountProfileMode } = require("../models/account");
const { Database } = require('../classes/database');
const { ContainerService } = require('./ContainerService');
const { DatabaseService } = require('./DatabaseService');
const LoggingService = require('./LoggingService');
const Vector2d = require('../models/Vector2d');
const { Item } = require('../models/Item');

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
     * @param {String} parentId the parentId of the item (can be undefined)  
     * @returns {Object} new Inventory Item 
     */
    addTemplatedItemToSlot(profile, templateId, slotId, parentId) {
        if (!profile)
            return;

        if (!templateId)
            return;

        if (!slotId)
            return;

        const template = Database.getTemplateItemById(templateId);
        if (!template)
            return;

        const resultingNewItem = {
            "_id": bsgHelper.generateMongoId(),
            "_tpl": templateId,
            "slotId": slotId,
            "parentId": parentId !== undefined ? parentId : profile.Inventory.equipment
        };

        profile.Inventory.items.push(
            resultingNewItem
        );

        return resultingNewItem;
    }

    /**
     * 
     * @param {Object[]} items 
     * @param {String} itemId 
     * @param {Boolean} includeParent 
     * @returns {Object[]} Items
     */
    findChildItemsOfItemId(items, itemId, includeParent = false) {
        if (!items)
            return;

        if (!itemId)
            return;

        const childItems = [];
        for(const it of items) {

            if (includeParent && it._id === itemId) {
                childItems.push(it);
                continue;
            }

            if (!it.parentId)
                continue;

            if (it.parentId === itemId && !childItems.find(x => x._id == it._id)) {
                childItems.push(it);
            }

        }

        for(const it of childItems) {
            for (const childOfChildItem of this.findChildItemsOfItemId(items, it._id, false))
                childItems.push(childOfChildItem);
        }

        return childItems;
    }

    /**
     * TODO: Look into this! Seems overly complicated...
     * Regenerate all Unique Identifiers with new IDs, for the exception of special item types (e.g. quest, sorting table, etc.) This
     * function will not mutate the original items array, but will return a new array with new GUIDs.
     * 
     * This function was originally created by SP-Tarkov (credits to SP-Tarkov for the original code).
     * https://github.com/sp-tarkov/server/blob/7cda4d567a33aee1c6b5ae25b125e1914236cffd/project/src/helpers/ItemHelper.ts#L823
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
        let stringifiedItemsList = JSON.stringify(items);
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
            stringifiedItemsList = stringifiedItemsList.replace(new RegExp(oldId, "g"), newId);

            // Also replace in quick slot if the old ID exists.
            if (fastPanel) {
                for (const itemSlot in fastPanel) {
                    if (fastPanel[itemSlot] === oldId) {
                        fastPanel[itemSlot] = fastPanel[itemSlot].replace(new RegExp(oldId, "g"), newId);
                    }
                }
            }
        }

        items = JSON.parse(stringifiedItemsList);

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
     * @returns {Vector2d} { x, y } Stash Size X and Y
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
        const templatesItemData = DatabaseService.getDatabase().getData(DatabaseService.getDatabase()["templates"]["items"]);

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

            const itemTemplate = templatesItemData[item._tpl];
            console.log(itemTemplate);
            // for(var iWidth = itemLocation.x; i < itemLocation.x + itemTemplate._props.width )
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


    /**
     * 
     * @param {AccountProfileCharacter} pmcProfile 
     */
    getStashContainerMap(pmcProfile) {
        const stashXY = this.getPlayerStashSizeXAndY(pmcProfile);


        const map = this.getContainerArray(
            pmcProfile.Inventory.stash
            , stashXY
            , pmcProfile.Inventory.items.filter(x => x.slotId == 'hideout') // items to look at to fill the container
            , pmcProfile.Inventory.items // all items
        );
        // console.log(map);
        return map;
        // const stash2d = this.create2DArray(stashXY.y, stashXY.x);
        // const templatesItemData = Database.getData(DatabaseService.getDatabase()["templates"]["items"]);
        // const pmcProfileStashItems = pmcProfile.Inventory.items.filter(x=>x.slotId == 'hideout');
        // if(pmcProfileStashItems.length > 0) {
        //     for(const item of pmcProfileStashItems) {

        //         const itemTemplate = templatesItemData[item._tpl];
        //         let itemWidth = itemTemplate._props.Width;
        //         let itemHeight = itemTemplate._props.Height;
        //         let itemPositionUp = 0;
        //         let itemPositionLeft = 0;
        //         for(const childItem of this.findChildItemsOfItemId(pmcProfile.Inventory.items, item._id)) {
        //             const childItemTemplate = templatesItemData[childItem._tpl];

        //             if(childItemTemplate && childItemTemplate._props) {
        //                 itemPositionUp -= childItemTemplate._props.ExtraSizeUp ?? 0;
        //                 itemPositionLeft -= childItemTemplate._props.ExtraSizeLeft ?? 0;
        //                 itemWidth = Math.max(itemWidth, itemWidth + childItemTemplate._props.ExtraSizeLeft + childItemTemplate._props.ExtraSizeRight);
        //                 itemHeight = Math.max(itemHeight, itemHeight + childItemTemplate._props.ExtraSizeUp + childItemTemplate._props.ExtraSizeDown);
        //             }
        //         }

        //         for (let iWidth = item.location.x - itemPositionLeft; iWidth < item.location.x + itemWidth; iWidth++) {
        //             for (let iHeight = item.location.y - itemPositionUp; iHeight < item.location.y + itemHeight; iHeight++) {
        //                 stash2d[iHeight][iWidth] = 1
        //             }
        //         }
        //     }
        // }

        // Note: handy if you want to debug the stash
        // console.log(stash2d);
        return stash2d;
    }

    /**
     * TODO: This does not work in the current state, needs to be fixed
     * @param {string} containerId 
     * @param {Vector2d} containerSizeXandY 
     * @param {Item[]} rootItems rootItems are the items filtered
     * @param {Item[]} allItems allItmes are all the items in the container
     * @returns 
     */
    getContainerArray(containerId, containerSizeXandY, rootItems, allItems) {

        if (!containerId)
            throw 'containerId must be provided';

        if (!containerSizeXandY)
            throw 'containerSizeXandY must be provided';

        if (!rootItems)
            throw 'rootItems must be provided';

        if (!allItems)
            throw 'allItems must be provided';

        // Create the array as designated by the container size X and Y variables
        // 0 means nothing is in that spot, 1 means there is
        const array2d = this.create2DArray(containerSizeXandY.y, containerSizeXandY.x);
        const templatesItemData = DatabaseService.getDatabase().getData(DatabaseService.getDatabase()["templates"]["items"]);

        // Fill 2D Array with current Items
        for(const item of rootItems) {
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

            const itemTemplate = templatesItemData[item._tpl];

            let itemWidth = itemTemplate._props.Width;
            let itemHeight = itemTemplate._props.Height;
            let itemPositionUp = 0;
            let itemPositionLeft = 0;
            const childItems = this.findChildItemsOfItemId(allItems, item._id);
            for(const childItem of childItems) {
                const childItemTemplate = templatesItemData[childItem._tpl];

                if(childItemTemplate && childItemTemplate._props) {
                    itemPositionUp -= childItemTemplate._props.ExtraSizeUp ?? 0;
                    itemPositionLeft -= childItemTemplate._props.ExtraSizeLeft ?? 0;
                    itemWidth = Math.max(itemWidth, itemWidth + childItemTemplate._props.ExtraSizeLeft + childItemTemplate._props.ExtraSizeRight);
                    itemHeight = Math.max(itemHeight, itemHeight + childItemTemplate._props.ExtraSizeUp + childItemTemplate._props.ExtraSizeDown);
                }
            }

            if (itemLocation.y == 6 && itemTemplate._name == 'weapon_hk_mp5_navy3_9x19') {
                console.log(item);
            }
            
            for (let iWidth = item.location.x; iWidth < item.location.x + (itemWidth); iWidth++) {
                for (let iHeight = item.location.y; iHeight < item.location.y + (itemHeight); iHeight++) {

                    if (iWidth > containerSizeXandY.x - 1) {
                        LoggingService.logWarning(`Width Index of ${iWidth} cannot be larger than ${containerSizeXandY.x}`);
                        continue;
                    }

                    if (iHeight > containerSizeXandY.y - 1) {
                        LoggingService.logWarning(`Height Index of ${iHeight} cannot be larger than ${containerSizeXandY.y}`);
                        continue;
                    }

                    array2d[iHeight][iWidth] = 1
                }
            }

        
        }

        // console.log(array2d);

        return array2d;

    }

    /**
     * 
     * @param {AccountProfileCharacter} profile 
     * @param {Object} newCurrentItem 
     * @returns {Object} the item with a location
     */
    placeItemIntoPlayerStash(profile, newCurrentItem) {

        const templateItem = Database.getTemplateItems()[newCurrentItem._tpl];
        const stashContainerMap = this.getStashContainerMap(profile);
        const placementResult = ContainerService
                                .findSpotForItem(stashContainerMap,
                                    templateItem._props.Width,
                                    templateItem._props.Height
                                );

        if(placementResult && placementResult.success) {
            newCurrentItem.location = {};
            newCurrentItem.location.x = placementResult.x;
            newCurrentItem.location.y = placementResult.y;
            newCurrentItem.location.r = !placementResult.rotation ? 0 : 1,
            newCurrentItem.location.rotation = placementResult.rotation;

            const stashId = profile.Inventory.stash;
            newCurrentItem.parentId = stashId;
            profile.Inventory.items.push(newCurrentItem);
            return newCurrentItem;
        }

        return undefined;
    }


    getAllAvailableBackpacks() {
        const backpackParentId = "5448e53e4bdc2d60728b4567";
        const list = this.getAllAvailableItemOptionsByParentId(backpackParentId);
        return list;
    }

    getAllAvailableItemOptionsByParentId(parentId) {
        Database.getTemplateItemsAsArray();
        const list = Database.cached.templatesByParentId[parentId];
        return list;
    }

    /**
     * 
     * @param {AccountProfileCharacter} character 
     * @param {String} itemId 
     * @return {Item} Item from the inventory or undefined if not found
     */
    findItemInInventory(character, itemId) {
        return character.Inventory.items.find(x=> x._id === itemId);
    }

    /**
     * 
     * @param {AccountProfileCharacter} character 
     * @param {any} item 
     */
    addItemToInventory(bot, item) {
        if (!bot.Inventory.items) {
            bot.Inventory.items = [];
        }

        if (!bot.Inventory.items.find(x => x._id === item._id)) {
            bot.Inventory.items.push(item);
        } else {
            LoggingService.logWarning(`Item ${item._id} already exists in inventory`);
        }
    }

    /**
     * 
     * @param {AccountProfileCharacter} bot 
     * @param {Item} item 
     * @param {string} slotId 
     * @returns 
     */
    addItemToInventoryWithinSlotContainer(bot, item, slotId) {
        if (!bot.Inventory.items) {
            bot.Inventory.items = [];
        }

        // Check if the item already exists in the inventory
        const existingItem = bot.Inventory.items.find(x => x._id === item._id);
        if (existingItem) {
            LoggingService.logWarning(`Item ${item._id} already exists in inventory`);
            return;
        }

        let itemAtSlotId = bot.Inventory.items.find(x => x.slotId === slotId);
        if (!itemAtSlotId)
            return;

        let parentId = itemAtSlotId?._id;
        let parentTemplateId = itemAtSlotId?._tpl;
        // If the parentId is not found, set it to the equipment slot
        if (!parentId) {
            parentId = bot.Inventory.equipment;
        }

        // const templateItem = this.getTemplateItem(item._tpl);
        // if (!templateItem)
        //     return;
        
        // const parentTemplateItem = this.getTemplateItem(parentTemplateId);
        // if (!parentTemplateItem)
        //     return;

        // for (const grid of parentTemplateItem._props.Grids) {
        //     let container = this.getContainerArray(parentId, new Vector2d(grid._props.cellsV, grid._props.cellsH), bot.Inventory.items.filter(x => x.parentId == parentId), bot.Inventory.items);
        //     const spot = ContainerService.findSpotForItem(container, templateItem._props.Width, templateItem._props.Height);
        //     if (spot.success) {
        //         ContainerService.addItemToContainerMap(container, spot.x, spot.y, templateItem._props.Width, templateItem._props.Height);
        //         // if (!item.upd)
        //         //     item.upd = {};

        //         // item.location = { x: spot.x, y: spot.y };
        //         // item.upd.location = { x: spot.x, y: spot.y };
        //         // item.parentId = parentId;
        //         break;
        //     }
        // }

        if (!item.parentId && !item.location)
            return;

        // Add the item to the inventory
        bot.Inventory.items.push(item);
    }

    /**
     * 
     * @param {AccountProfileCharacter} bot 
     */
    removeDormantIds(bot) {
        const requestParentIds = [];
        for (const item of bot.Inventory.items) {
            if (typeof(item.parentId) != 'undefined' && !requestParentIds.find(x => x == item.parentId))
                requestParentIds.push(item.parentId);
        }

        for (const item of bot.Inventory.items) {
            if (requestParentIds.includes(item._id)) {
                const findIndex = requestParentIds.findIndex(x => x == item._id);
                requestParentIds.splice(findIndex, 1);
            }
        }

        for (const id of requestParentIds) {
            const findIndex = bot.Inventory.items.findIndex(x => x.parentId == id);
            if (findIndex !== -1)
                bot.Inventory.items.splice(findIndex, 1);
        }
        

        return bot.Inventory.items;
    }

}

module.exports.InventoryService = new InventoryService();
