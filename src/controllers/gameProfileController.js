/**
 * Routing for /client/game/profile/... routes
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/AccountService');
const { BotGenerationService } = require('../services/BotGenerationService');

/**
 * @swagger
 * /client/game/profile/savage/regenerate:
 *   post:
 *     tags:
 *     - Game Profile
 *     summary: Called when regenerating the scav for the player's profile
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           type: object
 *           properties:
 *               nickname:
 *                  type: string
 *                  default: 'hello'
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/savage/regenerate', function(req, res, next) {

    console.log(req.body);

    const account = AccountService.getAccount(req.SessionId);
    if (!account) {
        bsgHelper.nullResponse(res);
        next();
    }
    const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);

    const bot = BotGenerationService.generateBot({ Role: 'playerscav', playerProfileName: accountMode.characters.pmc.Info.Nickname });

    accountMode.characters.scav = bot;
    accountMode.characters.pmc.savage = accountMode.characters.scav._id;

    AccountService.saveAccount(account);
    bsgHelper.nullResponse(res);

    next();
});

/**
 * @swagger
 * /client/game/profile/list:
 *   post:
 *     tags:
 *     - Game Profile
 *     summary: Load Tarkov Call 14. List's the PMC [index 0] and Scav [index 1] profiles. If there is a blank array, the client assumes it is a new or wiped account.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/list', function(req, res, next) {

    const sessionId = req.SessionId;
    if (sessionId === undefined)
        throw "SessionId is not defined!";

    const output = [];
    /**
     * @type {AccountProfileMode}
     */
    const accountProfileByMode = sessionId !== undefined ? AccountService.getAccountProfileByCurrentMode(sessionId) : new Account();
    if (accountProfileByMode.characters.pmc !== undefined) {
        output.push(accountProfileByMode.characters.pmc);
        output.push(accountProfileByMode.characters.scav);

        bsgHelper.getBody(res, output);
        next();
        return;
    }
    // if the account has been wiped, send back blank array
    // TODO >>>

    // TODO: :)
    bsgHelper.addBSGBodyInResponseWithData(res, output);
    next();
});


module.exports = router;
