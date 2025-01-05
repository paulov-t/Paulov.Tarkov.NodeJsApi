const express = require('express');
const router = express.Router();
const bsgHelper =  require('../../../../bsgHelper');
const { AccountService } = require('../../../../services/AccountService');

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
router.post('/', function(req, res, next) {

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
