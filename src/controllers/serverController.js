/**
 * The C part of MVC for Match Controller. (client/server routes)
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/AccountService');
const { ProfileStatus } = require('../models/ProfileStatus');
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
const { ClientGameServerService } = require('../services/ClientGameServerService');
const ServerItem = require('../models/Server/ServerItem');
const ServerItemRequestBody = require('../models/Server/ServerItemRequestBody');


/**
 * @swagger
 * /client/server/list:
 *   post:
 *     tags:
 *     - Client/Server
 *     summary: Tarkov Call 31
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/list', function(req, res, next) {

    // console.log(req.body);
    
    bsgHelper.addBSGBodyInResponseWithData(res, ClientGameServerService.gameServers.filter(server => server.status === 2));
    next();
});


/**
 * @swagger
 * /client/server/add:
 *   post:
 *     tags:
 *     - Client/Server
 *     summary: Custom matchmaking. Add a server to the list of servers.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/add', function(req, res, next) {

    console.log(req.body);

    /**
     * @type {ServerItemRequestBody} 
     */
    let serverItemRequestBody = req.body;
    bsgHelper.addBSGBodyInResponseWithData(res, ClientGameServerService.startMatchmaking(serverItemRequestBody));
    next();
});


/**
 * @swagger
 * /client/server/remove:
 *   post:
 *     tags:
 *     - Client/Server
 *     summary: Custom matchmaking. Remove a server from the list of servers.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/remove', function(req, res, next) {

    console.log(req.body);

     /**
     * @type {ServerItemRequestBody} 
     */
    let serverItemRequestBody = req.body;
    ClientGameServerService.stopMatchmaking(serverItemRequestBody);
    
    bsgHelper.addBSGBodyInResponseWithData(res, null);
    next();
});


module.exports = router;
