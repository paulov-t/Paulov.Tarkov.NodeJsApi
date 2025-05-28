var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');
const { AccountService } = require('../../services/AccountService');
const { BotGenerationService } = require('../../services/BotGenerationService');
const { DatabaseService } = require('../../services/DatabaseService');
const { BotGenerationCondition } = require("./../../models/BotGenerationCondition");
const { ProfileStatus } = require('../../models/ProfileStatus');
const { ProfileStatusResponse } = require('../../models/ProfileStatusResponse');
const { Database } = require('../../classes/database');
const { LocationWeatherTime } = require('../../models/LocationWeatherTime');
const { Weather } = require('../../models/Weather');
const LoggingService = require('../../services/LoggingService');
const { ECurrencyTemplates } = require('../../models/Enums/ECurrencyTemplates');
const { TraderService } = require('../../services/TraderService');
const { EnvironmentVariableService } = require('../../services/EnvironmentVariableService');


/**
 * @swagger
 * /client/game/mode:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 2
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/mode', function(req, res, next) {

    const sessionId = req.SessionId;
    if (!sessionId) {
        LoggingService.logError(`sessionId has not been set`);

        res.render('unauthorized');
        return;
    }

    const account = AccountService.getAccount(sessionId);
    if (!account) {
        LoggingService.logError(`account with sessionId ${sessionId} not found`);

        res.render('unauthorized');
        return;
    }

    let sessionMode = req.body.sessionMode;
    if (sessionMode === null) {
        if(!account.currentMode)
            sessionMode = "regular";
        else
            sessionMode = account.currentMode;
    }
    else {
        console.log("changed!");
    }

    account.currentMode = sessionMode;
    AccountService.saveAccount(account);

    bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: sessionMode, backendUrl: req.hostname });
    next();
  });

/**
 * @swagger
 * /client/game/start:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 3
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/start', function(req, res, next) {
    const today = new Date().toUTCString();
    const startTimeStampMS = Date.parse(today);

    const requestIp = require('request-ip');
    const clientIp = requestIp.getClientIp(req);
    console.log(`Client IP: ${clientIp}`);

    bsgHelper.addBSGBodyInResponseWithData(res, { utc_time: startTimeStampMS / 1000 });
    next();
  
  });
  
/**
 * @swagger
 * /client/game/version/validate:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 4
 *     responses:
 *       200:
 *         description: A successful response
 */
  router.post('/game/version/validate', function(req, res, next) {
    bsgHelper.nullResponse(res);

    if (req.SessionId) {
        // If the SessionId is set, we can load the account
        // and set it in the request object for later use
        const account = AccountService.getAccount(req.SessionId);
        if (account) {

            const index = AccountService.activeAccounts.findIndex(x => x == req.SessionId)
            if (index === -1)
                AccountService.activeAccounts.push(req.SessionId)
        }
    }



    next();
  
  });

/**
 * @swagger
 * /client/languages:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 5
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/languages', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db =  DatabaseService.getDatabase();
    const dbResult = db.getData(db["locales"]["languages"]);

    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/game/config:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 6
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/config', function(req, res, next) {

    const sessionId = req.SessionId;

    const today = new Date().toUTCString();
    const startTimeStampMS = Date.parse(today);

    // const protocol = req.protocol
    const protocol = "https"

    // Main needs the https:// ... i think?
    const backend = {
        Main: `${protocol}://${req.hostname}/`,
        Messaging: `${protocol}://${req.hostname}/`,
        Trading: `${protocol}://${req.hostname}/`,
        RagFair: `${protocol}://${req.hostname}/`,
        Lobby: `${protocol}://${req.hostname}/`,
    }

    const result = 
    { 
        queued: false,
        banTime: -1,
        hash: "",
        lang: "en",
        aid: req.SessionId,
        token: req.SessionId,
        taxonomy: "",
        activeProfileId: req.SessionId,
        nickname: req.SessionId,
        utc_time: startTimeStampMS / 1000,
        totalInGame: 0,
        purchasedGames: { eft: true, arena: true },
        isGameSynced: true,
        backend: backend
    };
    console.log(result);
    bsgHelper.getBody(res, result);
    next();

});

/**
 * @swagger
 * /client/items:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 7
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/items', function(req, res, next) {

     /**
     * @type {Database}
     */
      const db = DatabaseService.getDatabase();
      const dbResult = db.getData(db["templates"]["items"]);

    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/customization:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 8
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/customization', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbResult = db.getData(db["templates"]["customization"]);
    bsgHelper.getBody(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/customization/storage:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 9
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/customization/storage', function(req, res, next) {

    /*
    expected list of object 
    {
        id, type, source
    }
    */
    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbResult = db.getData(db["templates"]["customisationStorage"]);
    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/globals:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 10
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/globals', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbResult = db.getData(db["globals"]);
    dbResult.time = Date.now() / 1000;

    const envVars = EnvironmentVariableService.getEnvironmentVariables();
    if(envVars.ZOMBIES_ONLY == 'true') {
        const infection = dbResult.config.SeasonActivity.InfectionHalloween;
        infection.DisplayUIEnabled = true;
        infection.Enabled = true;

        for (const key of Object.keys(dbResult.LocationInfection)) {
            dbResult.LocationInfection[key] = 100;
        }
    }
    else {

    }

    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/settings:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 11
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/settings', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbResult = db.getData(db["settings"]);

    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    next();
});

/**
 * @swagger
 * /client/prestige/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 12
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/prestige/list', function(req, res, next) {

     /*
    expected object 
    {
        elements array
    }
    */
   /**
     * @type {Database}
     */
   const db = DatabaseService.getDatabase();
   const dbResult = db.getData(db["templates"]["prestige"]);
   bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
   next();
});

/**
 * @swagger
 * /client/trading/api/traderSettings:
 *   post:
 *     tags:
 *     - Client
 *     summary: Load Tarkov Call 13
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/trading/api/traderSettings', function(req, res, next) {

     /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const traderEntries = db["traders"];
    const traderBases = [];
    for (const traderId in traderEntries) {
        traderBases.push(db.getData(traderEntries[traderId].base));
    }

    bsgHelper.addBSGBodyInResponseWithData(res, traderBases);
    next();
});

/**
 * @swagger
 * /client/locale/{lang}:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 15
 *     parameters:
 *      - name: lang
 *        in: path
 *        description: The language requested
 *        required: true
 *     responses:
 *       200:
 *         description: An object with language result in data member
 */
router.post('/locale/:lang', function(req, res, next) {

    let lang = req.params["lang"];
    if(lang === undefined)
        lang = "en";

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const localeEntries = db["locales"];
    const localeEntry = localeEntries.global[lang];
    const result = db.getData(localeEntry);

    bsgHelper.getUnclearedBody(res, result);
    next();
});

/**
 * @swagger
 * /client/game/profile/nickname/reserved:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 16
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/nickname/reserved', function(req, res, next) {


    let defaultName = "Hello Paulov";
    let account = AccountService.getAccount(req.SessionId);
    if (account)
        defaultName = account.username;

    bsgHelper.addBSGBodyInResponseWithData(res, defaultName);
    next();
});

/**
 * @swagger
 * /client/game/profile/nickname/validate:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 17
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/nickname/validate', function(req, res, next) {

    const myAccount = AccountService.getAccount(req.SessionId);
    const myAccountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
    if (!myAccountProfile)
    {
        const result = { status: "ok" };
        bsgHelper.addBSGBodyInResponseWithData(res, result);
        next();
        return;
    }

    console.log(req.body);
    let requestedNickname = req.body.nickname;
    const result = { status: "ok" };
    for(const otherAccount of AccountService.getAllAccounts()) {
        const otherAccountProfile = AccountService.getAccountProfileByModeFromAccount(otherAccount, myAccount.currentMode);
        if (!otherAccountProfile)
            continue;

        if (otherAccountProfile.characters.pmc?.Info?.Nickname === requestedNickname)
        {
            result.status = "invalid";
            break;
        }
    }

    bsgHelper.addBSGBodyInResponseWithData(res, result);
    next();
});

/**
 * @swagger
 * /client/game/profile/create:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 18 (only run when Creating Character)
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/create', function(req, res, next) {

    // If we are running via Swagger UI, fake a SessionId / Account creation
    if (req.SessionId === undefined)
        req.SessionId = bsgHelper.generateMongoId();

    AccountService.createAccount(req.body, req.SessionId);

    bsgHelper.addBSGBodyInResponseWithData(res, req.SessionId);

    next();
});

/**
 * @swagger
 * /client/game/keepalive:
 *   post:
 *     tags:
 *     - Client
 *     summary: Keep Alive Command
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/keepalive', function(req, res, next) {

    // If we are running via Swagger UI, fake a SessionId / Account creation
    if (req.SessionId === undefined)
        req.SessionId = bsgHelper.generateMongoId();

    bsgHelper.addBSGBodyInResponseWithData(res, { utc_time: Date.now() / 1000 });

    next();
});

/**
 * @swagger
 * /client/game/profile/select:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 19
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/select', function(req, res, next) {
    bsgHelper.addBSGBodyInResponseWithData(res, { status: "ok" });
    next();
});

/**
 * @swagger
 * /client/profile/status:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 20
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/profile/status', function(req, res, next) {

    let account = AccountService.getAccount(req.SessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!req.SessionId) {
        account = AccountService.getAllAccounts()[0];
    }

    let accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);

    if(!accountMode.characters || !accountMode.characters.pmc)
        throw new "PMC is missing!";

    const savageStatus = new ProfileStatus();
    savageStatus.profileid = accountMode.characters.scav._id;
    const pmcStatus = new ProfileStatus();
    pmcStatus.profileid = accountMode.characters.pmc._id;
    const response = new ProfileStatusResponse(
        false,
        [
            savageStatus,
            pmcStatus
        ]
    );


    

    if(AccountService.recalculateLevel(accountMode.characters.pmc).hasChanged)
        AccountService.saveAccount(account);


    if(AccountService.fixHealth(account, accountMode.characters.pmc).hasChanged)
        AccountService.saveAccount(account);
    

    bsgHelper.addBSGBodyInResponseWithData(res, response);
    next();
});

/**
 * @swagger
 * /client/weather:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 21
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/weather', function(req, res, next) {

    const dt = new Date();
    let result = new LocationWeatherTime();

    const tomorrow = 1000 * 60 * 60 * 24;
    const stpetersbergtime = 1000 * 60 * 60 * 3;
    const tarkovTime = new Date((stpetersbergtime + (dt.getTime() * 7)) % tomorrow);
    
    const hoursText = tarkovTime.getHours() < 10 ? `0${tarkovTime.getHours()}` : tarkovTime.getHours();
    const minText = tarkovTime.getMinutes() < 10 ? `0${tarkovTime.getMinutes()}` : tarkovTime.getMinutes();
    const secondText = tarkovTime.getSeconds() < 10 ? `0${tarkovTime.getSeconds()}` : tarkovTime.getSeconds();
    
    const dateOnlyString = dt.toISOString().slice(0, 10);
    result.date = `${dateOnlyString}`; 
    result.time = `${hoursText}:${minText}:${secondText}`; 
    result.weather.time = `${result.date} ${result.time}`;
    result.weather.timestamp = Math.floor(tarkovTime / 1000)
    // console.log(result);
    bsgHelper.addBSGBodyInResponseWithData(res, result);
    next();
});

/**
 * @swagger
 * /client/handbook/templates:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 23
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/handbook/templates', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbHandbook = db.getData(db.templates.handbook);

    if(!dbHandbook)
        throw "Handbook not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHandbook);

    next();
});

/**
 * @swagger
 * /client/builds/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 29
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/builds/list', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { equipmentBuilds: [], weaponBuilds: [], magazineBuilds: [] });

    next();
});

/**
 * @swagger
 * /client/notifier/channel/create:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 30
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/notifier/channel/create', function(req, res, next) {

    if (typeof(req.SessionId) === 'undefined') {
        next();
        return;
    }

    let wsUrl = `wss://paulovtarkovnodejsapi-dev.azurewebsites.net/${req.SessionId}`;
    // Note: This is a bit of a hack to deal with "localhost" not supporting Secure Web Sockets due to authentication issues
    const unsupportedHostnames = [
            'localhost',
            '127.0.0.1'
        ];
    if (unsupportedHostnames.findIndex(x => x == req.hostname) !== -1)
        wsUrl = `ws://${req.hostname}/${req.SessionId}`;

    bsgHelper.addBSGBodyInResponseWithData(res, {
        server: `${req.hostname}`,
        channel_id: req.SessionId,
        // ws: `ws://${req.hostname}/notifierServer/getwebsocket/${req.SessionId}`,
        // ws: `wss://${req.hostname}/notifierServer/getwebsocket/${req.SessionId}`,
        ws: wsUrl
    });

    next();
});

/**
 * @swagger
 * /client/mail/dialog/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 36
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/mail/dialog/list', function(req, res, next) {

    const account = AccountService.getAccount(req.SessionId);
    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    
    bsgHelper.addBSGBodyInResponseWithData(res, accountProfile.socialNetwork.dialogues);

    next();
});



/**
 * @swagger
 * /client/achievement/statistic:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 38
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/achievement/statistic', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbAchievements = db.getData(db.templates.achievements);
    if(!dbAchievements)
        throw "Achievements not found";

    const stats = {};
    // for (const achievement of dbAchievements) {
    //     stats[achievement.id] = 0;
    // }

    bsgHelper.addBSGBodyInResponseWithData(res, { elements: stats });

    next();
});


/**
 * @swagger
 * /client/achievement/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 39
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/achievement/list', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbAchievements = db.getData(db.templates.achievements);
    if(!dbAchievements)
        throw "Achievements not found";

    bsgHelper.addBSGBodyInResponseWithData(res, { elements: dbAchievements });

    next();
});


/**
 * @swagger
 * /client/repeatalbeQuests/activityPeriods:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 40
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/repeatalbeQuests/activityPeriods', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, []);

    next();
});



/**
 * @swagger
 * /client/game/logout:
 *   post:
 *     tags:
 *     - Client
 *     summary: Logout call when clicking Exit
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/logout', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, {});

    if (req.SessionId) {
        // If the SessionId is set, we can load the account
        // and set it in the request object for later use
        const account = AccountService.getAccount(req.SessionId);
        if (account) {

        const index = AccountService.activeAccounts.findIndex(x => x == req.SessionId)
        if (index !== -1)
            AccountService.activeAccounts.splice(index, 1)
        }
    }

    next();
});

/**
 * @swagger
 * /client/checkVersion:
 *   post:
 *     tags:
 *     - Client
 *     summary: Called to check the Version of the game against updates, could be useful for Client updates?
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/checkVersion', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { isvalid: true });

    next();
});

/**
 * @swagger
 * /client/items/prices/{id}:
 *   post:
 *     tags:
 *     - Client
 *     summary: Gets the prices for all items when viewing trader screens
 *     parameters:
 *      - name: id
 *        in: path
 *        description: Trader Id requested
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/items/prices/:id', function(req, res, next) {

    let id = req.params["id"];
    if(id === undefined)
        throw "Expected parameter id";

    const prices = TraderService.getTraderPrices(id);

    bsgHelper.addBSGBodyInResponseWithData(res, {
        supplyNextTime: Math.floor(new Date().getTime() / 1000) + 1000,
        prices: prices,
        currencyCourses: {
            "5449016a4bdc2d6f028b456f": prices[ECurrencyTemplates.RUB],
            "569668774bdc2da2298b4568": prices[ECurrencyTemplates.EUR],
            "5696686a4bdc2da3298b456a": prices[ECurrencyTemplates.USD],
            "5d235b4d86f7742e017bc88a": prices[ECurrencyTemplates.GP],
        },
    });

    next();
});

/**
 * @swagger
 * /client/insurance/items/list/cost:
 *   post:
 *     tags:
 *     - Client
 *     summary: Receive a list of items to insure and provide a cost against the items. TODO. Currently only provides the MAX value of the items back. Write with the coef.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/insurance/items/list/cost', function(req, res, next) {

    const sessionId = req.SessionId;

    const result = {};
    const inventoryItemsByItemId = {};

    let account = AccountService.getAccount(sessionId);
    // if we are running via Swagger UI and SessionId is null. Get first account to test with.
    if(!sessionId) {
        const allAccounts = AccountService.getAllAccounts();
        account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
    }

    const accountProfile = AccountService.getAccountProfileByCurrentMode(account.accountId);
    const accountInventory = accountProfile.characters.pmc.Inventory;
    // console.log(accountInventory);
    const inventoryItems = accountProfile.characters.pmc.Inventory.items;

    const pmcData = account
    for (const item of inventoryItems) {
        inventoryItemsByItemId[item._id] = item;
    }

    const prices = Database.getData(Database.templates.prices);

    for (const trader of req.body.traders) {
        const items = {};

        for (const itemId of req.body.items) {

            if (!inventoryItemsByItemId[itemId]) 
                continue;

            items[inventoryItemsByItemId[itemId]._tpl] = prices[inventoryItemsByItemId[itemId]._tpl];
            if (!items[inventoryItemsByItemId[itemId]._tpl])
                items[inventoryItemsByItemId[itemId]._tpl] = 1000;

            // items[inventoryItemsHash[itemId]._tpl] = this.insuranceService.getRoublePriceToInsureItemWithTrader(
            //     pmcData,
            //     inventoryItemsHash[itemId],
            //     trader,
            // );
        }

        result[trader] = items;
    }

    bsgHelper.addBSGBodyInResponseWithData(res, result);

    next();
});

/**
 * @swagger
 * /client/raid/configuration:
 *   post:
 *     tags:
 *     - Client
 *     summary: Sends the RaidSettings object to the Server so that it can configure the raid for this user. Does not expect a response.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/raid/configuration', function(req, res, next) {

    const account = AccountService.getAccount(req.SessionId);
    const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    // Store the desired Raid Configuration
    accountProfile.raidConfiguration = req.body;
    bsgHelper.nullResponse(res);
    AccountService.saveAccount(account);

    next();
});



/**
 * @swagger
 * /client/getMetricsConfig:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getMetricsConfig', function(req, res, next) {

    const metrics = Database.getData(Database.match.metrics);
    bsgHelper.getBody(res, metrics);
    next();
});


/**
 * @swagger
 * /client/game/bot/generate:
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
 *            conditions:
 *              type: Array
 *              default: [{Role: 'assault', Limit: 9, Difficulty: 'normal'}]
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/bot/generate', async function(req, res, next) {

    const result = [];

    /**
     * @type {BotGenerationCondition}
     */
    const conditions = req.body.conditions;

    for(const condition of conditions) {
        for (let index = 0; index < condition.Limit; index++)
            result.push(BotGenerationService.generateBot(condition));
    }

    bsgHelper.getBody(res, result);

    next();
});




/**
 * @swagger
 * /client/putMetrics:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/putMetrics', function(req, res, next) {

    console.log(req.body);

    bsgHelper.nullResponse(res);

    next();
});

/**
 * @swagger
 * /client/localGame/weather:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/localGame/weather', function(req, res, next) {

    console.log(req.body);

    const result = {
        season: 2,
        weather: []
    }
    result.weather.push(new Weather());
    // result.weather.push(new Weather());

    bsgHelper.getBody(res, result);

    next();
});

/**
 * @swagger
 * /client/analytics/event-disconnect:
 *   post:
 *     tags:
 *     - Client
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/analytics/event-disconnect', function(req, res, next) {

    console.log(req.body);
    bsgHelper.nullResponse(res);

    next();
});

/**
 * @swagger
 * /client/profile/view:
 *   post:
 *     tags:
 *     - Client
 *     summary: Called when clicking "View Profile" on the friends list
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/profile/view', function(req, res, next) {

    const sessionId = req.SessionId;
    console.log(req.body);

    const otherAccount = AccountService.getAccount(req.body.accountId);
    const otherAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(otherAccount);
    const pmcCharacter = otherAccountByMode.characters.pmc;
    const scavCharacter = otherAccountByMode.characters.scav;
    const hideoutKeys = [...Object.values(pmcCharacter.Inventory.hideoutAreaStashes), pmcCharacter.Inventory.hideoutCustomizationStashId];
    const hideoutItems = pmcCharacter.Inventory.items.filter(x => hideoutKeys.includes(x._id));
    const itemsToReturn = [];
    for (const item of hideoutItems) {
        const foundItems = InventoryService.findChildItemsOfItemId(pmcCharacter.Inventory.items, item._id);
        itemsToReturn.push(...foundItems);
    }
    const responseBody = {
        favoriteItems: [],
        id: pmcCharacter._id,
        aid: req.body.accountId,
        info: pmcCharacter.Info,
        achievements: pmcCharacter.Achievements,
        customization: pmcCharacter.Customization,
        equipment: {
            Id: pmcCharacter.Inventory.equipment,
            Items: pmcCharacter.Inventory.items,
        },
        pmcStats: pmcCharacter.Stats,
        scavStats: scavCharacter.Stats,
        skills: pmcCharacter.Skills,
        hideout: pmcCharacter.Hideout,
        customizationStash: pmcCharacter.Inventory.hideoutCustomizationStashId,
        hideoutAreaStashes: pmcCharacter.Inventory.hideoutAreaStashes,
        items: itemsToReturn
    };
    bsgHelper.addBSGBodyInResponseWithData(res, responseBody);
    next();
});


module.exports = router;
