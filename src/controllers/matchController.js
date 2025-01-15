/**
 * The C part of MVC for Match Controller. (client/match routes)
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/AccountService');
const { ProfileStatus } = require('../models/ProfileStatus');
const { ProfileStatusResponse } = require('../models/ProfileStatusResponse');
const { Account, AccountProfileMode } = require('../models/Account');
const { Database } = require('../classes/database');

const { LocalMatchStartResponse } = require('../models/Responses/LocalMatchStartResponse');
const { LocalMatchEndResponse } = require('../models/Responses/LocalMatchEndResponse');
const { UpdatableChatMember } = require('../models/UpdatableChatMember');
const { MatchGroup } = require('../models/MatchGroup');

const { ClientRequestDataDumpService } = require('./../services/ClientRequestDataDumpService');
const { InventoryService } = require('./../services/InventoryService');

const { logger } = require('./../classes/logger');


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


/**
 * @swagger
 * /client/match/join:
 *   post:
 *     tags:
 *     - Match
 *     summary: Tarkov Call 32
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/join', function(req, res, next) {

    let account = AccountService.getAccount(req.SessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!req.SessionId) {
        account = AccountService.getAllAccounts()[0];
    }
    
    const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    
    if(!accountMode.characters || !accountMode.characters.pmc)
        throw new "PMC is missing!";

    // Get the desired Raid details
    const raidConfig = accountMode.raidConfiguration;
    console.log(raidConfig);

    const savageStatus = new ProfileStatus();
    savageStatus.profileid = accountMode.characters.scav._id;
    const pmcStatus = new ProfileStatus();
    pmcStatus.profileid = accountMode.characters.pmc._id;

    // From what I can gather from Client
    // MatchWait or Free will immediately abort the matching
    // So we must set it to "Busy"?
    pmcStatus.status = "Busy";
    pmcStatus.ip = "127.0.0.1";
    pmcStatus.port = 443;

    const response = new ProfileStatusResponse(
        false,
        [
            savageStatus,
            pmcStatus
        ]
    );
    bsgHelper.addBSGBodyInResponseWithData(res, response);

    next();
});

/**
 * @swagger
 * /client/match/available:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/available', function(req, res, next) {
   
    // If we respond true here whilst in PvP (and without any client mods in the mix), the vanilla client will attempt to call client/match/join with a requested set of params. 
    // Unless the client has a Network host at the other end to connect to, it will fail after 4 seconds and kick back to main menu

    bsgHelper.getBody(res, false);
    // bsgHelper.getBody(res, true);

    next();
});

/**
 * @swagger
 * /client/match/local/end:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           type: object
 *           properties:
 *            location:
 *              type: string
 *              default: factory4_day
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/local/end', function(req, res, next) {

    console.log(req.body);
    const isKilled = req.body.results.result === 'Killed';

    // Dump the match client request body. Will be useful for Swagger and Tests.
    ClientRequestDataDumpService.dumpData("MatchLocalEnd", req.body);

    const result = new LocalMatchEndResponse();
    result.serverId = req.body.serverId;

    const myAccount = AccountService.getAccount(req.SessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

    /**
     * WARNING Inventory.items is NOT the full Inventory
     * @type {AccountProfileCharacter} 
     */
    const newProfileToSave = req.body.results.profile;

    const isPMC = myAccountByMode.characters.pmc._id == newProfileToSave._id;

    // =========================================================================
    // Update Achievements on Player Profile
    if (isPMC) {
        for (const achievementId in newProfileToSave.Achievements) {
            if (!myAccountByMode.characters.pmc.Achievements[achievementId]) {
                myAccountByMode.characters.pmc.Achievements[achievementId] = newProfileToSave.Achievements[achievementId];
                logger.logSuccess(`Added achievement ${achievementId}!`)
            }
        }
    }

    // END OF: Update Achievements on Player Profile
    // =========================================================================

    // =========================================================================
    // Update Experience on Player Profile
    if (isPMC) {
        myAccountByMode.characters.pmc.Info.Experience = newProfileToSave.Info.Experience;
    }
    else {
        myAccountByMode.characters.scav.Info.Experience = newProfileToSave.Info.Experience;
    }

    // =========================================================================
    // Update Experience on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.InsuredItems = newProfileToSave.InsuredItems;

    // =========================================================================
    // Replace Inventory on Player Profile

    if (isPMC) {
        /**
         * WARNING Inventory.items is NOT the full Inventory
         * @type {Inventory} 
         */
        const newProfileToSaveInventory = newProfileToSave.Inventory;
        const newProfileToSaveInventoryItems = newProfileToSaveInventory.items;
        for(const newInvItem of newProfileToSaveInventoryItems) {
            InventoryService.removeItemAndChildItemsFromProfile(myAccountByMode.characters.pmc, newInvItem._id);
        }
        for(const newInvItem of newProfileToSaveInventoryItems) {
            const indexOf = myAccountByMode.characters.pmc.Inventory.items.findIndex(x => x._id === newInvItem._id);
            if (indexOf === -1)
                myAccountByMode.characters.pmc.Inventory.items.push(newInvItem);
        }
    }

    // END OF: Replace Inventory on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Health on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Health = newProfileToSave.Health;
    // END OF: Replace Health on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Quests on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Quests = newProfileToSave.Quests;
    // END OF: Replace Quests on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Stats on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Stats = newProfileToSave.Stats;
    else
        myAccountByMode.characters.scav.Stats = newProfileToSave.Stats;
    // END OF: Replace Stats on Player Profile
    // =========================================================================

    result.results = req.body.results;

    AccountService.saveAccount(myAccount);
    logger.logSuccess(`Saved account ${myAccount.accountId}!`)
    
    bsgHelper.getBody(res, result);

    next();
});

module.exports = router;