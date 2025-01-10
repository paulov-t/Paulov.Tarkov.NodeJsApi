/**
 * The C part of MVC for Match Controller. (client/match routes)
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/AccountService');
const { BotGenerationService, BotGenerationCondition } = require('../services/BotGenerationService');
const { ProfileStatus } = require('../models/ProfileStatus');
const { ProfileStatusResponse } = require('../models/ProfileStatusResponse');
const { Account, AccountProfileMode } = require('../models/Account');
const { Database } = require('../classes/database');

const { LocalMatchStartResponse } = require('../models/Responses/LocalMatchStartResponse');
const { LocalMatchEndResponse } = require('../models/Responses/LocalMatchEndResponse');
const { UpdatableChatMember } = require('../models/UpdatableChatMember');
const { MatchGroup } = require('../models/MatchGroup');

/**
 * @swagger
 * /client/match/group/current:
 *   post:
 *     tags:
 *     - Match
 *     summary: Tarkov Call 32
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/current', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { squad: [], raidSettings: undefined });

    next();
});

/**
 * @swagger
 * /client/match/group/invite/send:
 *   post:
 *     tags:
 *     - Match
 *     summary: Called from the Group section (bottom left)
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/invite/send', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
    // If the group hasn't been initialised. Then create one
    if (!myAccountByMode.socialNetwork.group)
        myAccountByMode.socialNetwork.group = new MatchGroup();

    if (!myAccountByMode.socialNetwork.group.groupMemberInvites)
        myAccountByMode.socialNetwork.group.groupMemberInvites = [];

    if (myAccountByMode.socialNetwork.group.groupMemberInvites.findIndex(requestBody.to) === -1)
        myAccountByMode.socialNetwork.group.groupMemberInvites.push(requestBody.to);

    AccountService.saveAccount(myAccount);

    bsgHelper.addBSGBodyInResponseWithData(res, bsgHelper.generateMongoId());

    next();
});

/**
 * @swagger
 * /client/match/group/invite/cancel-all:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/invite/cancel-all', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

    // Clear out the group
    if (myAccountByMode.socialNetwork.group) {
        myAccountByMode.socialNetwork.group.groupMembers = [];
        myAccountByMode.socialNetwork.group.groupMemberInvites = [];
    }
    AccountService.saveAccount(myAccount);

    bsgHelper.addBSGBodyInResponseWithData(res, { });

    next();
});

/**
 * @swagger
 * /client/match/group/exit_from_menu:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/exit_from_menu', function(req, res, next) {

    bsgHelper.nullResponse(res);

    next();
});

module.exports = router;