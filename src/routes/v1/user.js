
var express = require('express');
const { getBody } = require('../../bsgHelper');
const { AccountService } = require('../../services/AccountService');
var router = express.Router();

/**
 * @swagger
 * /v1/user/details/{id}/{mode}:
 *   get:
 *     tags:
 *     - User
 *     summary: Gets the user account data to display on views
 *     parameters:
 *      - name: id
 *        in: path
 *        description: The Account Id
 *        required: true
 *      - name: mode
 *        in: path
 *        description: The Play Mode
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.get('/details/:id/:mode', function(req, res, next) {

    let userAccountId = req.params["id"];
    if(userAccountId === undefined)
        throw "userAccountId not provided"

    let mode = req.params["mode"];
    if(mode === undefined)
        throw "mode not provided"


    if (!AccountService.accountExists(userAccountId))
        throw "account not found"

    const account = AccountService.getAccount(userAccountId);
    if(account === undefined)
        throw "account not found"

    getBody(res, { profile: account.modes[mode] })
    next();
});

/**
 * @swagger
 * /v1/user/live:
 *   get:
 *     tags:
 *     - User
 *     summary: Gets the users that are currently online
 *     responses:
 *       200:
 *         description: A successful response
 */
router.get('/live', function(req, res, next) {

    const users = [];
    for (const account of AccountService.getAllAccounts()) {
        if (AccountService.activeAccounts.includes(account.accountId)) {
            users.push({
                username: account.username,
                mode:  AccountService.getAccountProfileByCurrentModeFromAccount(account).name.toUpperCase(),
                level: AccountService.getAccountProfileByCurrentModeFromAccount(account).characters.pmc.Info.Level
            });
        }
    }

    getBody(res, users)
    next();
});

module.exports = router;
