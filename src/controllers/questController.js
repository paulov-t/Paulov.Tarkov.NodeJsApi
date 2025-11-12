var express = require('express');
var router = express.Router();
var { AccountService } = require('../services/AccountService');
const { getBody } = require('../bsgHelper');
const { getRenderViewModel, getRenderViewModelWithUsername } = require('../classes/shared');
const { Database } = require('../classes/database');
var bsgHelper =  require('../bsgHelper');
const { QuestService } = require('../services/QuestService');

/**
 * @swagger
 * /client/quest/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 37
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/list', function(req, res, next) {

    let account = AccountService.getAccount(req.SessionId);
    if (!account)
        account = AccountService.getAllAccounts()[0];
    
    bsgHelper.addBSGBodyInResponseWithData(res, QuestService.getAllQuestsForAccount(account));

    next();
});

module.exports = router;
