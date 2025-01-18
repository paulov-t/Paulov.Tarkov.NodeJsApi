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


module.exports = router;
