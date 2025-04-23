/**
 * itemsMovingController
 * This controller is for handling the very over complicated BSG "items/moving" route and actions
 * BSG supply an object which will be an array of "Actions", these "actions" can be very different in terms of data and what they can provide. 
 * 
 * It seems this was meant for the WebSocket OR it was an attempt to stop the client making so many calls to the Server per action.
 * 
 * What I have done to combat this is to switch case the Action and then create a function per action
 */


const express = require('express');
const router = express.Router();
const bsgHelper =  require('./../bsgHelper');
const { AccountService } = require('./../services/AccountService');
const { logger } = require('./../classes/logger');
const { TraderService } = require('../services/TraderService');
const { Database } = require('../classes/database');
const { InventoryService } = require('../services/InventoryService');
const { AccountProfileCharacterQuestItem, Account } = require('../models/Account');
const { DatabaseService } = require('../services/DatabaseService');
const { BuyFromTraderAction, BuyFromTraderActionSchemeItem } = require('../models/ItemMovingActions/BuyFromTraderAction');
const { ContainerService } = require('../services/ContainerService');

/**
 * @swagger
 * /client/game/profile/items/moving:
 *   post:
 *     summary: Called when moving items around in your stash or completing tasks
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           type: object
 *           properties:
 *            data:
 *              type: array
 *              default: [{ Action: 'Move', item: "6776cb85e28385787000017f", to: { id: "6613bb72b5b0ba138a0fab07", container: "hideout", location: { x: 4, y: 43, r: horizontal } } }]
 *            reload:
 *              type: number
 *              default: 15
 *            tm:
 *              type: number
 *              default: 5
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/moving', function(req, res, next) {

    const sessionId = req.SessionId;

    if (!req.body.data) {
        // throw "Body data is required";
    }

    let account = AccountService.getAccount(sessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!sessionId) {
        const allAccounts = AccountService.getAllAccounts();
        account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
    }

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);

    const result = {
        warnings: [],
        profileChanges: {
            
        }
    }
    result.profileChanges[account.accountId] = {
        _id: account.accountId,
        experience: accountProfile.characters.pmc.Info.Experience,
        quests: [],
        ragFairOffers: [],
        weaponBuilds: [],
        equipmentBuilds: [],
        items: { new: [], change: [], del: [] },
        production: {},
        improvements: {},
        skills: { Common: [], Mastering: [], Points: 0 },
        health: JSON.parse(JSON.stringify(accountProfile.characters.pmc.Health)),
        traderRelations: {},
        recipeUnlocked: {},
        questsStatus: []
    }

    /**
     * Example of data
     * data: [{ }]
     * reload: 16
     * tm: 13
     */
    let bodyActionList = req.body.data;
    for(const action of bodyActionList) {
        console.log(action);
        switch(action.Action) {
            case 'Examine':
                const examinedItem = InventoryService.findItemInInventory(accountProfile.characters.pmc, action.item);
                if (examinedItem)
                    accountProfile.characters.pmc.Encyclopedia[examinedItem._tpl] = true
                break;
            case 'Heal':
                processHealAction(account, action, result);
                break;
            case 'HideoutUpgrade':
                processHideoutUpgradeAction(account, action, result);
                break;
            case 'HideoutUpgradeComplete':
                processHideoutUpgradeCompleteAction(account, action, result);
                break;
            case 'Merge':
                processMergeAction(account, action, result);
                break;
            case 'Move':
                processMoveAction(account, action, result);
                break;
            case 'QuestAccept':
                processQuestAccept(account, action, result);
                break;
            case 'QuestComplete':
                processQuestComplete(account, action, result);
                    break;
            case 'RestoreHealth':
                processRestoreHealth(account, action, result);
                break;
            case 'TraderRepair':
                processTraderRepair(account, action, result);
                break;
            case 'TradingConfirm':
                processTradingConfirm(account, action, result);
                break;
            case 'Transfer':
                processTransfer(account, action, result);
                break;
            case 'QuestHandover':
                processQuestHandover(account, action, result);
                break;
        }
    }


    result.profileChanges[account.accountId].traderRelations = updateTraderRelations(account);

    AccountService.saveAccount(account);
    
    console.log("/moving final result");
    console.log(result);

    bsgHelper.getBody(res, result);
    next();
});

function processHealAction(account, action, outputChanges) {

    const result = { success: true, error: undefined };
    logger.logDebug("processHealAction");

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    logger.logDebug(`Healing ${account.accountId}`);

    const pmcProfile = accountProfile.characters.pmc;
    const healingItemToUse = pmcProfile.Inventory.items.find((item) => item._id === action.item);
    logger.logDebug(`Using ${healingItemToUse._id}`);

    const profilePart = accountProfile.characters.pmc.Health.BodyParts[action.part];
    profilePart.Health.Current = profilePart.Health.Current + action.count > profilePart.Health.Maximum ? profilePart.Health.Maximum : profilePart.Health.Current + account.count;
    if (profilePart.Health.Current == "NaN") {
        profilePart.Health.Current = profilePart.Health.Maximum;
    }
    return result;
}

function processHideoutUpgradeAction(account, action, outputChanges) {
    const result = { success: false, error: undefined };
    logger.logDebug("processHideoutUpgradeAction");

    const accountProfileMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    if (!accountProfileMode)
        return result;

    const pmcProfile = accountProfileMode.characters.pmc;

    const profileHideoutArea = pmcProfile.Hideout.Areas.find((area) => area.type === action.areaType);
    if (!profileHideoutArea)
        return result;

    const dbHideoutAreas = Database.getData(Database.hideout.areas)

    const constructionTime = dbHideoutAreas
                            .find((area) => area.type === action.areaType)
                            .stages[profileHideoutArea.level + 1].constructionTime;
    if (constructionTime > 0) {

        const nowTimestamp = Math.floor(new Date().getTime() / 1000);
        profileHideoutArea.completeTime = Math.round(nowTimestamp + constructionTime);
        profileHideoutArea.constructing = true;
    }

    // We've made it. Success!
    result.success = true;
    return result;
}

function processHideoutUpgradeCompleteAction(account, action, outputChanges) {
    const result = { success: true, error: undefined };
    logger.logDebug("processHideoutUpgradeCompleteAction");

    const accountProfileMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    if (!accountProfileMode)
        return result;

    const pmcProfile = accountProfileMode.characters.pmc;

    const profileHideoutArea = pmcProfile.Hideout.Areas.find((area) => area.type === action.areaType);
    if (!profileHideoutArea)
        return result;

    profileHideoutArea.level++;
    profileHideoutArea.completeTime = 0;
    profileHideoutArea.constructing = false;

    return result;
}

function processMoveAction(account, action, outputChanges) {

    outputChanges.profileChanges[account.accountId].items = {};
    const result = { success: true, error: undefined };
    // console.log(action);

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    // const accountInventory = accountProfile.characters.pmc.Inventory;
    // console.log(accountInventory);
    const inventoryItems = accountProfile.characters.pmc.Inventory.items;

    const matchingInventoryItem = inventoryItems.find((item) => item._id === action.item);
    if (!matchingInventoryItem) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }
    // console.log(matchingInventoryItem);
    matchingInventoryItem.location = action.to.location;
    matchingInventoryItem.parentId = action.to.id;
    matchingInventoryItem.slotId = action.to.container;

    // outputChanges.profileChanges[account.accountId].items.change.push(matchingInventoryItem);
    return result;
}

function processMergeAction(account, action, outputChanges) {

    outputChanges.profileChanges[account.accountId].items = {};
    const result = { success: true, error: undefined };
    // console.log(action);

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    // const accountInventory = accountProfile.characters.pmc.Inventory;
    // console.log(accountInventory);
    const inventoryItems = accountProfile.characters.pmc.Inventory.items;

    // From
    const matchingInventoryItemIndex = inventoryItems.findIndex((item) => item._id === action.item);
    const matchingInventoryItem = inventoryItems.find((item) => item._id === action.item);
    if (!matchingInventoryItem) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }

    const amountFrom = matchingInventoryItem.upd.StackObjectsCount;

    // To
    const matchingInventoryItemTo = inventoryItems.find((item) => item._id === action.with);
    if (!matchingInventoryItemTo) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }

    const amountTo = matchingInventoryItemTo.upd.StackObjectsCount;
    const newAmount = Math.ceil(amountFrom + amountTo);

    matchingInventoryItemTo.upd.StackObjectsCount = newAmount;

    // finally, remove the merged from item from the player's inventory
    inventoryItems.splice(matchingInventoryItemIndex, 1);

    return result;
}


function processRestoreHealth(account, action, outputChanges) {

    const result = { success: true, error: undefined };

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    
    for (const bodyPartKey in action.difference.BodyParts) {
        const partRequest = action.difference.BodyParts[bodyPartKey];
        const profilePart = pmcProfile.Health.BodyParts[bodyPartKey];

        // Bodypart healing is chosen when part request hp is above 0
        if (partRequest.Health > 0) {
            // Heal bodypart
            profilePart.Health.Current = profilePart.Health.Maximum;
        }

        if (partRequest.Effects?.length > 0) {
            for (const effect of partRequest.Effects) {
                delete pmcProfile.Health.BodyParts[bodyPartKey].Effects[effect];
            }

            if (Object.keys(pmcProfile.Health.BodyParts[bodyPartKey].Effects).length === 0) {
                delete pmcProfile.Health.BodyParts[bodyPartKey].Effects;
            }
        }
    }

    outputChanges.profileChanges[pmcProfile._id].health = pmcProfile.Health;
    return result;
}

function processQuestAccept(account, action, outputChanges) {

    const result = { success: true, error: undefined };

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const allQuests = Database.getTemplateQuests();
    const questToAccept = allQuests[action.qid];
    if (questToAccept) {
        logger.logInfo(`Accepting ${questToAccept._id}`);
        const index = pmcProfile.Quests.findIndex(x => x.qid === questToAccept._id);
        if (index === -1) {
            logger.logWarning(`Could not find ${questToAccept._id}. Adding the item.`);
            let profileQuestItem = new AccountProfileCharacterQuestItem();
            profileQuestItem.qid = questToAccept._id;
            profileQuestItem.startTime = Math.round(Date.now() / 1000);
            pmcProfile.Quests.push(profileQuestItem);
        }
        else {
            let profileQuestItem = pmcProfile.Quests[index];
            logger.logDebug(`Found ${questToAccept._id} at index ${index}`);
            if (profileQuestItem) {
                profileQuestItem.status = "Started";
            }
        }


    }

    return result;
}

function processQuestComplete(account, action, outputChanges) {

    const result = { success: true, error: undefined };

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const allQuests = Database.getTemplateQuests();
    const quest = allQuests[action.qid];
    const index = pmcProfile.Quests.findIndex(x => x.qid === quest._id);
    if (index === -1) {
        return;
    }
    let profileQuestItem = pmcProfile.Quests[index];
    profileQuestItem.status = "Success";

    logger.logInfo(`Completed ${profileQuestItem._id}`);

    return result;
}

function processTraderRepair(account, action, outputChanges) {

    let result = { success: true, error: undefined };
    logger.logDebug("processTraderRepair");

    /**
     * @type {String}
     */
    const traderId = action.tid;
    /**
     * @type {Number}
     */
    const price = action.price;

    /**
     * @type {Database}
     */
    const db = global._database;
    const traderEntry = db["traders"][traderId];
    const assortEntry = traderEntry.assort;
    /**
     * @type {TraderAssort}
     */
    const traderDataResult = db.getData(assortEntry);

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const inventoryEquipmentId = pmcProfile.Inventory.equipment;
    const inventoryItems = pmcProfile.Inventory.items;
    for(const itemToRepairAction of action.repairItems) {
        const itemToRepair = inventoryItems.find(x => x._id === itemToRepairAction._id);
        if(!itemToRepair) {
            logger.logError("could not find item to repair");
            return { success: false, error: "could not find item to repair" };
        }

        if (!itemToRepair.upd)
            continue;

        if (!itemToRepair.upd.Repairable)
            continue;

        itemToRepair.upd.Repairable.Durability += itemToRepairAction.count;
        if(itemToRepair.upd.Repairable.Durability > itemToRepair.upd.Repairable.MaxDurability)
            itemToRepair.upd.Repairable.Durability = itemToRepair.upd.Repairable.MaxDurability;

    }
}


function processTradingConfirm(account, action, outputChanges) {

    let result = { success: true, error: undefined };
    logger.logDebug("processTradingConfirm");

    /**
     * @type {String}
     */
    const traderId = action.tid;
    /**
     * @type {Number}
     */
    const price = action.price;

    /**
     * @type {Database}
     */
    const db = global._database;
    const traderEntry = db["traders"][traderId];
    const assortEntry = traderEntry.assort;
    /**
     * @type {TraderAssort}
     */
    const traderDataResult = db.getData(assortEntry);

    switch(action.type) {
        case 'buy_from_trader':
            result = buyFromTrader(account, action, outputChanges);
            break;
        case 'sell_to_trader':
            result = sellToTrader(account, action, outputChanges);
            break;
    }

    return result;
}

/**
 * 
 * @param {Account} account 
 * @param {BuyFromTraderAction} action 
 * @returns 
 */
function buyFromTrader(account, action, outputChanges) {
    const result = { success: true, error: undefined };

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const inventoryEquipmentId = pmcProfile.Inventory.equipment;
    const inventoryItems = pmcProfile.Inventory.items;

    const traderId = action.tid;
    const trader = TraderService.getTrader(traderId);
    const templatePrices = Database.getData(Database.templates.prices);

    const userItemsToUse = action.scheme_items;
    const buyingItemId = action.item_id;
    const template = Database.getTemplateItems()[buyingItemId];

    let moneySalesSum = 0;

    const itemsToRemoveFromInventory = [];
    for(const userItemToUse of userItemsToUse) {

        const invItem = inventoryItems.find(x => userItemToUse.id == x._id);
        // console.log(invItem);
        // A stack of something, likely money in this case
        if (invItem.upd && invItem.upd.StackObjectsCount) {
            invItem.StackObjectsCount -= userItemToUse.count;
            if (invItem.upd.StackObjectsCount <= 0)
                itemsToRemoveFromInventory.push(invItem);

            moneySalesSum += userItemToUse.count;

        } else {
            itemsToRemoveFromInventory.push(invItem);
        }

    }

    // Remove the items from the Inventory
    for(const item of itemsToRemoveFromInventory) {
        const indexToRemove = inventoryItems.findIndex(x => x._id === item._id);
        if (indexToRemove !== -1)
            inventoryItems.splice(indexToRemove, 1);
    }

    const clonedParentItem = JSON.parse(JSON.stringify(trader.assort.items.find(x => x._id == action.item_id)));
    clonedParentItem._id = bsgHelper.generateMongoId();
    clonedParentItem.parentId = undefined;
    const newParentItemId = clonedParentItem._id;

    const childItems = InventoryService.findChildItemsOfItemId(trader.assort.items, action.item_id, false);
    if (childItems && childItems.length > 0) {
        // Buy and Transfer the item from Trader to Player
        for(const item of childItems) {
            
            const clonedItem = JSON.parse(JSON.stringify(item));
            clonedItem.parentId = newParentItemId;
            clonedItem._id = bsgHelper.generateMongoId();
            InventoryService.placeItemIntoPlayerStash(accountProfile.characters.pmc, clonedItem);

            console.log(clonedItem);

            inventoryItems.push(indexToRemove, 1);
        }
    }
    else {
        if(InventoryService.placeItemIntoPlayerStash(accountProfile.characters.pmc, clonedParentItem)) {

            if (!outputChanges.profileChanges[pmcProfile._id].items.new)
                outputChanges.profileChanges[pmcProfile._id].items.new = [];

            outputChanges.profileChanges[pmcProfile._id].items.new.push(clonedParentItem);
        }
    }

    if (moneySalesSum)
        pmcProfile.TradersInfo[traderId].salesSum += moneySalesSum;

    return result;
}

function sellToTrader(account, action, outputChanges) {
    const result = { success: true, error: undefined };

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const inventoryEquipmentId = pmcProfile.Inventory.equipment;
    const inventory = pmcProfile.Inventory.items;

    const traderId = action.tid;
    const trader = TraderService.getTrader(traderId);
    const templatePrices = Database.getData(Database.templates.prices);
    // console.log(templatePrices);

    let money = 0;
    for (const sellItem of action.items) {

        const itemsInInventory = inventory.filter(x => x._id == sellItem.id || x.parentId == sellItem.id);
        for(const itemInInventory of itemsInInventory) {
            if (!itemInInventory)
                continue;

            if (itemInInventory._id === inventoryEquipmentId)
                continue;

            // This will remove the item from the Client.
            if (itemInInventory.slotId == 'hideout') {
                if (typeof outputChanges.profileChanges[pmcProfile._id].items.del === "undefined") 
                    outputChanges.profileChanges[pmcProfile._id].items.del = [];

                outputChanges.profileChanges[pmcProfile._id].items.del.push(itemInInventory);
            }

            if (!templatePrices[itemInInventory._tpl])
                continue;

            const templatePrice = templatePrices[itemInInventory._tpl];
            let priceCoef = (trader.base.loyaltyLevels[0].buy_price_coef) / 100;
            let price = templatePrice >= 1 ? templatePrice : 1;
            let count =
                "upd" in itemInInventory && "StackObjectsCount" in itemInInventory.upd
                ? itemInInventory.upd.StackObjectsCount
                : 1;
            price = ((price - (price * priceCoef)) * count);

            money += price;

            // This will remove the item from the Server.
            InventoryService.removeItemAndChildItemsFromProfile(pmcProfile, itemInInventory._id);
        }

    }

    TraderService.givePlayerMoneyFromTrader(traderId, money, pmcProfile, outputChanges.profileChanges[pmcProfile._id]);
    pmcProfile.TradersInfo[traderId].salesSum += money;

    return result;
}

function processQuestHandover(account, action, outputChanges) {
    const result = { success: true, error: undefined };

    const quests = DatabaseService.getTemplateQuestsAsList();
    const quest = quests.find(x => x._id === action.qid);
    const handoverQuestTypes = ["HandoverItem", "WeaponAssembly"];

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const pmcProfile = accountProfile.characters.pmc;
    const profileQuest = pmcProfile.Quests.find(x => x.qid === action.qid);
    
    let counterValue = 0;
    for (const itemHandover of action.items) {
       
        const itemToHandOverInInventory = InventoryService.findItemInInventory(pmcProfile, itemHandover.id);
        if (!itemToHandOverInInventory)
            continue;

        if (typeof outputChanges.profileChanges[pmcProfile._id].items.del === "undefined") outputChanges.profileChanges[pmcProfile._id].items.del = [];
            outputChanges.profileChanges[pmcProfile._id].items.del.push({ _id: itemToHandOverInInventory._id });

        InventoryService.removeItemAndChildItemsFromProfile(pmcProfile, itemToHandOverInInventory._id);
        counterValue++;
    }

    for (const condition of quest.conditions.AvailableForFinish) {
        if (
            condition.id === action.conditionId &&
            handoverQuestTypes.includes(condition.conditionType)
        ) {
            if (pmcProfile.TaskConditionCounters[condition.id] !== undefined) {
                pmcProfile.TaskConditionCounters[condition.id].value += counterValue;
                return;
            }

            pmcProfile.TaskConditionCounters[condition.id] = {
                id: condition.id,
                sourceId: quest._id,
                type: "HandoverItem",
                value: counterValue,
            };
        }
    }
    return result;
}

function updateTraderRelations(account) {

   const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);

    const result = {};
    for (const traderId in accountMode.characters.pmc.TradersInfo) {
        const baseData = accountMode.characters.pmc.TradersInfo[traderId];
        result[traderId] = {
            salesSum: baseData.salesSum,
            disabled: baseData.disabled,
            loyalty: baseData.loyaltyLevel,
            standing: baseData.standing,
            unlocked: baseData.unlocked,
        };
    }
    return result;
}

function processTransfer(account, action, outputChanges) {

    outputChanges.profileChanges[account.accountId].items = {};
    const result = { success: true, error: undefined };
    // console.log(action);

    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    // const accountInventory = accountProfile.characters.pmc.Inventory;
    // console.log(accountInventory);
    const inventoryItems = accountProfile.characters.pmc.Inventory.items;

    // From
    const matchingInventoryItemIndex = inventoryItems.findIndex((item) => item._id === action.item);
    const matchingInventoryItem = inventoryItems.find((item) => item._id === action.item);
    if (!matchingInventoryItem) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }

    const amountFrom = action.count;
    matchingInventoryItem.upd.StackObjectsCount = Math.ceil(matchingInventoryItem.upd.StackObjectsCount - action.count);

    // To
    const matchingInventoryItemTo = inventoryItems.find((item) => item._id === action.with);
    if (!matchingInventoryItemTo) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }

    const amountTo = matchingInventoryItemTo.upd.StackObjectsCount;
    const newAmount = Math.ceil(amountFrom + amountTo);

    matchingInventoryItemTo.upd.StackObjectsCount = newAmount;

    // finally, if the amount of the merged item is now 0 or less, remove the from item from the player's inventory
    if (matchingInventoryItem.upd.StackObjectsCount < 1) 
        inventoryItems.splice(matchingInventoryItemIndex, 1);

    return result;
}

module.exports = router;
