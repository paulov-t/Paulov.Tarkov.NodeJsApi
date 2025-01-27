var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../../bsgHelper');
const { Account, AccountProfileMode } = require('../../models/Account');
const { AccountService } = require('../../services/AccountService');
const { TraderAssort } = require('./../../models/TraderAssort');

/**
 * @swagger
 * /client/trading/api/getTraderAssort/{traderId}:
 *   post:
 *     tags:
 *      - Trading
 *     summary: 
 *     parameters:
 *      - name: traderId
 *        in: path
 *        description: The TraderId
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getTraderAssort/:traderId', function(req, res, next) {
    let traderId = req.params["traderId"];
    if(traderId === undefined)
        throw "traderId not provided"

    let account = AccountService.getAccount(req.SessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!req.SessionId) {
        const allAccounts = AccountService.getAllAccounts();
        account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
    }

    const profile = AccountService.getAccountProfileByCurrentMode(account.accountId);
    const profileLoyaltyLevel = profile.characters.pmc.TradersInfo[traderId].loyaltyLevel;
    /**
     * @type {Database}
     */
    const db = global._database;
    const traderEntry = db["traders"][traderId];
    const assortEntry = traderEntry.assort;
    /**
     * @type {TraderAssort}
     */
    const dbResult = db.getData(assortEntry);
    dbResult.nextResupply = Math.floor((Date.now() / 1000) + 1000);

    for (const itemId in dbResult.loyal_level_items) {
        if (dbResult.loyal_level_items[itemId] > profileLoyaltyLevel) {
            delete dbResult.barter_scheme[itemId];
            delete dbResult.loyal_level_items[itemId];

            const itemIndex = dbResult.items.findIndex(x => x._id == itemId);
            if(itemIndex !== -1)
                dbResult.items.splice(itemIndex, 1);
        }
    }
    
    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    
    next();
});

/**
 * @swagger
 * /client/trading/api/getTraders:
 *   tags:
 *     - Trading
 *   post:
 *     summary: Paulov's Custom Endpoint to get all trader's name and Ids
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getTraders', function(req, res, next) {
    /**
     * @type {Database}
     */
    const db = global._database;
    const traderEntries = db["traders"];
    const result = [];
    for (const traderEntryId in traderEntries) {
        const data = db.getData(traderEntries[traderEntryId].base);
        if(data) {
            console.log(data);
            result.push({ traderId: data._id, name: data.nickname })
        }
    }

    bsgHelper.addBSGBodyInResponseWithData(res, result);
    
    next();
});

module.exports = router;