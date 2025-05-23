var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../../bsgHelper');
const { Account, AccountProfileMode } = require('../../models/Account');
const { AccountService } = require('../../services/AccountService');
const { TraderAssort } = require('./../../models/TraderAssort');
const { DatabaseService } = require('../../services/DatabaseService');
const { TraderService } = require('../../services/TraderService');

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
    if (!req.SessionId) {
        const allAccounts = AccountService.getAllAccounts();
        account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
    }

    if (!account)
        throw "Account not found";

    const profile = AccountService.getAccountProfileByCurrentMode(account.accountId);
    const profileLoyaltyLevel = profile.characters.pmc.TradersInfo[traderId].loyaltyLevel;
    
    /**
     * @type {TraderAssort}
     */
    const traderAssortData = TraderService.getTrader(traderId).assort;
    traderAssortData.nextResupply = Math.floor((Date.now() / 1000) + 1000);

    // Filter out items that are not available for the current loyalty level
    // and remove them from the barter scheme
    for (const itemId in traderAssortData.loyal_level_items) {
        if (traderAssortData.loyal_level_items[itemId] > profileLoyaltyLevel) {
            delete traderAssortData.barter_scheme[itemId];
            delete traderAssortData.loyal_level_items[itemId];

            const itemIndex = traderAssortData.items.findIndex(x => x._id == itemId);
            if(itemIndex !== -1)
                traderAssortData.items.splice(itemIndex, 1);
        }
    }

    // Floor the barter scheme item counts
    // to ensure they are integers
    for (const itemId in traderAssortData.barter_scheme) {
        for (const barterSchemeItemA of traderAssortData.barter_scheme[itemId]) {
            for (const barterSchemeItemB of barterSchemeItemA) {
                if (barterSchemeItemB.count) {
                    barterSchemeItemB.count = Math.floor(barterSchemeItemB.count);
                }
            }
        }
    }

    bsgHelper.addBSGBodyInResponseWithData(res, traderAssortData);
    
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
    const db = DatabaseService.getDatabase();
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