const express = require('express');
const router = express.Router();
const bsgHelper =  require('../../../../bsgHelper');
const { AccountService } = require('../../../../services/AccountService');

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

    const accountProfile = AccountService.getAccountProfileByCurrentMode(account.accountId);

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
            case 'Move':
                processMoveAction(sessionId, action, result);
                break;
        }
    }

    
    bsgHelper.addBSGBodyInResponseWithData(res, result);

    next();
});

function processMoveAction(sessionId, action, outputChanges) {

    const result = { success: true, error: undefined };
    console.log(sessionId);
    console.log(action);

    let account = AccountService.getAccount(sessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!sessionId) {
        const allAccounts = AccountService.getAllAccounts();
        account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
    }

    const accountProfile = AccountService.getAccountProfileByCurrentMode(account.accountId);
    const accountInventory = accountProfile.characters.pmc.Inventory;
    console.log(accountInventory);
    const inventoryItems = accountProfile.characters.pmc.Inventory.items;


    const matchingInventoryItem = inventoryItems.find((item) => item._id === action.item);
    if (!matchingInventoryItem) {
        result.success = false;
        result.error = "Couldn't find item in player";
        return result;
    }
    console.log(matchingInventoryItem);
    matchingInventoryItem.location = action.to.location;
    matchingInventoryItem.parentId = action.to.id;
    matchingInventoryItem.slotId = action.to.container;

    outputChanges.profileChanges[account.accountId].items.change.push(matchingInventoryItem);
    return result;
}

module.exports = router;
