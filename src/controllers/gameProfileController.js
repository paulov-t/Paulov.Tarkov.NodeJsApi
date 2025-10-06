/**
 * Routing for /client/game/profile/... routes
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/accountService');
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

    // Run an account fix
    AccountService.fixAccountsAfterUpdate();

    const output = [];
    /**
     * @type {AccountProfileMode}
     */
    const accountProfileByMode = sessionId !== undefined ? AccountService.getAccountProfileByCurrentMode(sessionId) : new Account();
    if (accountProfileByMode.characters.pmc !== undefined) {

        const account = AccountService.getAccount(sessionId);
        AccountService.fixHealth(account, accountProfileByMode.characters.pmc);

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


/**
 * @swagger
 * /client/game/profile/search:
 *   post:
 *     summary: Called when searching for players
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
router.post('/search', function(req, res, next) {

    const sessionId = req.SessionId;

    if (!req.body.nickname) {
        // throw "Body data is required";
    }
    const result = [];

    try {

        const allAccounts = AccountService.getAllAccounts();
        let myAccount = AccountService.getAccount(sessionId);
        // if we are running via Swagger UI and SessionId is null. Get first account to test with.
        if(!sessionId) {
            myAccount = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
        }
        const myAccountProfile = AccountService.getAccountProfileByCurrentMode(myAccount.accountId);
        for (const account of allAccounts) {
            const accountProfile = AccountService.getAccountProfileByCurrentMode(account.accountId);
            if (!accountProfile?.characters?.pmc?.Info?.LowerNickname?.includes(req.body.nickname.toLocaleLowerCase())) {
                continue;
            }

            // filter out own account
            if (account.accountId == myAccount.accountId)
                continue;

            result.push(AccountService.getChatMemberProfile(account));
        }
    }
    catch (err) {
        console.error(err);
    }

    bsgHelper.addBSGBodyInResponseWithData(res, result);

    next();
});


module.exports = router;
