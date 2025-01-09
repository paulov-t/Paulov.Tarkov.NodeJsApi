const express = require('express');
const router = express.Router();
const bsgHelper =  require('../../../../bsgHelper');
const { AccountService } = require('../../../../services/AccountService');
const { logger } = require('../../../../classes/logger');

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
            case 'Heal':
                processHealAction(account, action, result);
                break;
            case 'Move':
                processMoveAction(account, action, result);
                break;
            case 'RestoreHealth':
                processRestoreHealth(account, action, result);
                break;
            case 'TradingConfirm':
                processTradingConfirm(account, action, result);
                break;
        }
    }

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

function processRestoreHealth(account, action, outputChanges) {

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

function processTradingConfirmAction(account, action, outputChanges) {

    const result = { success: true, error: undefined };
    logger.logDebug("processTradingConfirmAction");

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
        case 'sell_to_trader':
            break;
    }

    return result;
}

module.exports = router;
