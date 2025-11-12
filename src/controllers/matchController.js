/**
 * The C part of MVC for Match Controller. (client/match routes)
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/AccountService');
const { ProfileStatus } = require('../models/ProfileStatus');
const { ProfileStatusResponse } = require('../models/profileStatusResponse');
const { Account, AccountProfileMode } = require('../models/Account');
const { Database } = require('../classes/database');

const { LocalMatchStartResponse } = require('../models/Responses/LocalMatchStartResponse');
const { LocalMatchEndResponse } = require('../models/Responses/LocalMatchEndResponse');
const { UpdatableChatMember } = require('../models/UpdatableChatMember');
const { MatchGroup } = require('../models/MatchGroup');

const { ClientRequestDataDumpService } = require('./../services/ClientRequestDataDumpService');
const { InventoryService } = require('./../services/InventoryService');

const LoggingService = require('./../services/LoggingService');

const { ENotificationType } = require('../models/ENotificationType');

const { WebSocketService } = require('./../services/WebSocketService');
const { GroupInvite } = require('../models/GroupInvite');

const { BotGenerationService } = require('../services/BotGenerationService');
const { LocationService } = require('../services/LocationService');
const { LootGenerationService } = require('../services/LootGenerationService');


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

    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

    let squad = [];
    let raidSettings = undefined;
    // If the group hasn't been initialised. Then create one
    if (myAccountByMode.socialNetwork.group) {
        squad = myAccountByMode.socialNetwork.group.groupMembers;
        raidSettings = myAccountByMode.socialNetwork.group.raidSettings;
    }

    bsgHelper.addBSGBodyInResponseWithData(res, { squad: squad, raidSettings: undefined });

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

    // if user is not logged in. send not logged in error.
    if (!WebSocketService.connections[requestBody.to]) {
        bsgHelper.errorResponse(res, 502014, "player not online");
        next();
        return;
    }

    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
    const newEventId = bsgHelper.generateMongoId();
    myAccountByMode.socialNetwork.groupInvite = new GroupInvite(newEventId, requestBody.to, false);

    // If the group hasn't been initialised. Then create one
    if (!myAccountByMode.socialNetwork.group)
        myAccountByMode.socialNetwork.group = new MatchGroup();

    if (!myAccountByMode.socialNetwork.group.groupMemberInvites)
        myAccountByMode.socialNetwork.group.groupMemberInvites = [];

    if (myAccountByMode.socialNetwork.group.groupMemberInvites.findIndex(x => x === requestBody.to) === -1)
        myAccountByMode.socialNetwork.group.groupMemberInvites.push(requestBody.to);

    const otherAccount = AccountService.getAccount(requestBody.to);
    const otherAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(otherAccount);
    otherAccountByMode.socialNetwork.groupInvite = new GroupInvite(newEventId, requestBody.to, myAccount.accountId, false);

    // Save the group before sending...
    AccountService.saveAccount(myAccount);
    AccountService.saveAccount(otherAccount);

    WebSocketService.sendGroupMatchInviteSend(requestBody.to, sessionId, myAccountByMode.socialNetwork.group.groupMemberInvites)

    bsgHelper.addBSGBodyInResponseWithData(res, otherAccountByMode.socialNetwork.groupInvite.eventId);

    next();
});

/**
 * @swagger
 * /client/match/group/invite/cancel:
 *   post:
 *     tags:
 *     - Match
 *     summary: Called from the Group section (bottom left)
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/invite/cancel', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

    // Requires a group to exist
    if (myAccountByMode.socialNetwork.group) {

        // Requires a group with groupMemberInvites to exist
        if (myAccountByMode.socialNetwork.group.groupMemberInvites) {

            // Requires a group with groupMemberInvites with the request id to exist
            const index = myAccountByMode.socialNetwork.group.groupMemberInvites.findIndex(x => x === requestBody.to) ;
            if (index !== -1) {
                // Remove the indexed groupMember
                myAccountByMode.socialNetwork.group.groupMemberInvites.splice(index, 1);
                AccountService.saveAccount(myAccount);
            }
        }
    }

    bsgHelper.addBSGBodyInResponseWithData(res, bsgHelper.generateMongoId());

    next();
});

/**
 * @swagger
 * /client/match/group/invite/accept:
 *   post:
 *     tags:
 *     - Match
 *     summary: Called from the Popup Accept button
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/invite/accept', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
    const sessionId = req.SessionId;
    const myAccount = AccountService.getAccount(sessionId);
    const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

    if (!myAccountByMode.socialNetwork.groupInvite) { 
        bsgHelper.errorResponse(res, 502014, "no group invite found");
        next();
        throw "No groupInvite found on this account!";
    }

    // TODO: Rewrite Groups into the Service. This will only work 1-2-1 but not when 3 or more people are join asymetrically
    const groupMembers = myAccountByMode.socialNetwork.groupInvite.members;
    const memberIds = [];
    for(const member of groupMembers) {
        // only send to other people?
        // if (member._id !== sessionId)
        memberIds.push(member._id);
    }

    for(const memberId of memberIds) {
        WebSocketService.sendGroupMatchInviteAccept(memberId, sessionId, memberIds);
    }


    // Expects array of the group members
    bsgHelper.addBSGBodyInResponseWithData(res, groupMembers);

    next();
});


/**
 * @swagger
 * /client/match/group/invite/cancel-all:
 *   post:
 *     tags:
 *     - Match
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/group/invite/cancel-all', function(req, res, next) {

    const requestBody = req.body;
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
 *     - Match
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
router.post('/join', async function(req, res, next) {

    console.log(req.body);
    if (!req.body.servers || req.body.servers.length < 2)
        throw "No servers found in request body";

    const chosenServer = req.body.servers[1]; 

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

    if (raidConfig) {
        if (raidConfig.side  == 'Pmc') {
            // From what I can gather from Client
            // MatchWait or Free will immediately abort the matching
            // So we must set it to "Busy"
            pmcStatus.status = "Busy";
            pmcStatus.ip = chosenServer.ip;
            pmcStatus.port = chosenServer.port;
            pmcStatus.sid = "PMC001";
            pmcStatus.shortId = "PMC001";
        }
        else {
            savageStatus.status = "Busy";
            savageStatus.ip = chosenServer.ip;
            savageStatus.port = chosenServer.port;
            pmcStatus.sid = "SCV001";
            pmcStatus.shortId = "SCV001";
        }
    }
   
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
 *     - Match
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/available', function(req, res, next) {
   
    // If we respond true here whilst in PvP (and without any client mods in the mix), the vanilla client will attempt to call client/match/join with a requested set of params. 
    // Unless the client has a Network host at the other end to connect to, it will fail after 4 seconds and kick back to main menu

    // bsgHelper.getBody(res, false);
    bsgHelper.getBody(res, true);

    next();
});

/**
 * @swagger
 * /client/match/local/end:
 *   post:
 *     tags:
 *     - Match
 *     summary: Called when ending a local match and attempting to save the data of the local match
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
                LoggingService.logSuccess(`Added achievement ${achievementId}!`)
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
    // Update Insured Items on Player Profile
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

        if (isKilled) {

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "Headwear");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "Eyewear");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "FaceCover");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "Earpiece");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "ArmorVest");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "TacticalVest");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "FirstPrimaryWeapon");
            
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "SecondPrimaryWeapon");

            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "Holster");

            // Remove all items from the pockets 
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "pocket1");
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "pocket2");
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "pocket3");
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "pocket4");

            // 
            InventoryService.removeItemFromSlot(myAccountByMode.characters.pmc, "Backpack");

        }
    }

    // END OF: Replace Inventory on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Health on Player Profile
    if (isPMC) {
        myAccountByMode.characters.pmc.Health = newProfileToSave.Health;
        AccountService.fixHealth(myAccount, myAccountByMode.characters.pmc);
    }
    // END OF: Replace Health on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Quests on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Quests = newProfileToSave.Quests;
    // END OF: Replace Quests on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Skills on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Skills = newProfileToSave.Skills;
    else
        myAccountByMode.characters.scav.Skills = newProfileToSave.Skills;
    // END OF: Replace Stats on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace Stats on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.Stats = newProfileToSave.Stats;
    else
        myAccountByMode.characters.scav.Stats = newProfileToSave.Stats;
    // END OF: Replace Stats on Player Profile
    // =========================================================================

    // =========================================================================
    // Replace TaskConditionCounters on Player Profile
    if (isPMC) 
        myAccountByMode.characters.pmc.TaskConditionCounters = newProfileToSave.TaskConditionCounters;
    else
        myAccountByMode.characters.scav.TaskConditionCounters = newProfileToSave.TaskConditionCounters;
    // END OF: Replace Stats on Player Profile
    // =========================================================================

    result.results = req.body.results;

    // Empty the raidSettings for the Group
    if (myAccountByMode.socialNetwork.group) {
        myAccountByMode.socialNetwork.group.raidSettings = undefined;
    }

    // Save the Account
    AccountService.saveAccount(myAccount);
    LoggingService.logSuccess(`Saved account ${myAccount.accountId}!`)
    
    bsgHelper.getBody(res, result);

    next();
});


/**
 * @swagger
 * /client/match/local/start:
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
router.post('/local/start', async function(req, res, next) {

    if (!req.body.location)
        throw `expected location in request body`

    const location = req.body.location.toLowerCase();
    if (!Database.locations[location]) {
        console.log(Database.locations);
        throw `${location} doesn't exist in Database.locations`
    }

    const result = new LocalMatchStartResponse(location);
    result.locationLoot = new LocationService().getLocationByLocationName(location);

    let botGenService = BotGenerationService;

    // generate temporary instance
    let lootGenService = new LootGenerationService();
    // Add Loot
    result.locationLoot.Loot = lootGenService.Generate(result.locationLoot);
    // Release the instance
    // delete lootGenService;

    // Add Insured Items
    if (req.SessionId) {
        const account = AccountService.getAccount(req.SessionId);
        if(account) {
            const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
            const insuredItems = accountProfile.characters?.pmc?.InsuredItems;
            if (insuredItems)
                result.profile.insuredItems = insuredItems;

            AccountService.saveAccount(account);
        }
    }

    bsgHelper.getBody(res, result);

    next();
});

module.exports = router;