var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');
const { AccountService } = require('../../services/AccountService');
const { BotGenerationService } = require('../../services/BotGenerationService');
const { BotGenerationCondition } = require("./../../models/BotGenerationCondition");
const { ProfileStatus } = require('../../models/ProfileStatus');
const { ProfileStatusResponse } = require('../../models/ProfileStatusResponse');
const { Account, AccountProfileMode } = require('../../models/Account');
const { Database } = require('../../classes/database');

const { LocalMatchStartResponse } = require('../../models/Responses/LocalMatchStartResponse');
const { LocalMatchEndResponse } = require('../../models/Responses/LocalMatchEndResponse');
const { UpdatableChatMember } = require('../../models/UpdatableChatMember');
const { InventoryService } = require('../../services/InventoryService');
const { Inventory } = require('../../models/Inventory');
const { ClientRequestDataDumpService } = require('../../services/ClientRequestDataDumpService');
const { LocationWeatherTime } = require('../../models/LocationWeatherTime');
const { Weather } = require('../../models/Weather');
const { logger } = require('../../classes/logger');
const { LootGenerationService } = require('../../services/LootGenerationService');
const { LocationService } = require('../../services/LocationService');


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

    const account = AccountService.getAccount(sessionId);

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

    bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: sessionMode, backendUrl: req.host });
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
    const db = global._database;
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

    // Main needs the https:// ... i think?
    const backend = {
        Main: `${req.protocol}://${req.host}/`,
        Messaging: `${req.protocol}://${req.host}/`,
        Trading: `${req.protocol}://${req.host}/`,
        RagFair: `${req.protocol}://${req.host}/`,
        Lobby: `${req.protocol}://${req.host}/`,
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
      const db = global._database;
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
    const db = global._database;
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
    const db = global._database;
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
     const db = global._database;
     const dbResult = db.getData(db["globals"]);
     dbResult.time = Date.now() / 1000;

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
    const db = global._database;
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
   const db = global._database;
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
    const db = global._database;
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
    const db = global._database;
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

    let accountMode = AccountService.getAccountProfileByCurrentMode(account.accountId);

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

    let result = { acceleration: 1, time: "", date: "", weather: undefined, season: 1 }; 
    const year = new Date().getUTCFullYear();
    result.date = `${year}-01-01`
    result.time = bsgHelper.getInRaidTime(undefined);
    result.time = `${result.date} 13:00:00`; 
    result.weather = { 
        cloud: 0,
        wind_speed: 0,
        wind_direction: 1,
        wind_gustiness: 0,
        rain: 0,
        rain_intensity: 0,
        fog: 0,
        temp: 0,
        pressure: 0,
        time: `${result.date} 13:00:00`,
        date: `${year}-01-01`,
        timestamp: 0
    }
    console.log(result);

    result = new LocationWeatherTime();
console.log(result);
    bsgHelper.addBSGBodyInResponseWithData(res, result);
    next();
});

/**
 * @swagger
 * /client/locations:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 22
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/locations', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, new LocationService().getAllLocationData());

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
    const db = global._database;
    const dbHandbook = db.getData(db.templates.handbook);

    if(!dbHandbook)
        throw "Handbook not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHandbook);

    next();
});

/**
 * @swagger
 * /client/hideout/areas:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 24
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/hideout/areas', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = global._database;
    const dbAreas = db.getData(db.hideout.areas);
    if(!dbAreas)
        throw "Hideout Areas not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbAreas);

    next();
});

/**
 * @swagger
 * /client/hideout/qte/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 25
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/hideout/qte/list', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = global._database;
    const dbHideoutQte = db.getData(db.hideout.qte);
    if(!dbHideoutQte)
        throw "Hideout QTE not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutQte);

    next();
});

/**
 * @swagger
 * /client/hideout/settings:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 26
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/hideout/settings', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = global._database;
    const dbHideoutSettings = db.getData(db.hideout.settings);
    if(!dbHideoutSettings)
        throw "Hideout Settings not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutSettings);

    next();
});

/**
 * @swagger
 * /client/hideout/production/recipes:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 27
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/hideout/production/recipes', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = global._database;
    const dbHideoutProduction = db.getData(db.hideout.production);
    if(!dbHideoutProduction)
        throw "Hideout Production not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutProduction);

    next();
});

/**
 * @swagger
 * /client/hideout/customization/offer/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 28
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/hideout/customization/offer/list', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = global._database;
    const dbHideoutCustomisation = db.getData(db.hideout.customisation);
    if(!dbHideoutCustomisation)
        throw "Hideout Customisation not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutCustomisation);

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

    // const dbHideoutCustomisation = global._database.hideout.customisation;
    // if(!dbHideoutCustomisation)
    //     throw "Hideout Customisation not found";

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

    bsgHelper.addBSGBodyInResponseWithData(res, {
        server: `${req.host}`,
        channel_id: req.SessionId,
        // url: "",
        // notifierServer: req.host,
        ws: `ws://${req.host}/notifierServer/getwebsocket/${req.SessionId}`,
    });

    next();
});

/**
 * @swagger
 * /client/server/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 31
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/server/list', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, [{ ip: `https://${req.host}`, port: 443 }]);
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

    bsgHelper.addBSGBodyInResponseWithData(res, []);

    next();
});

/**
 * @swagger
 * /client/quest/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 37
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/quest/list', function(req, res, next) {

    const allQuests = Database.getTemplateQuests();
    let account = AccountService.getAccount(req.SessionId);
    if (!account)
        account = AccountService.getAllAccounts()[0];


    const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const playerQuests = [];// accountMode.characters.pmc.Quests;

    for (const questId in allQuests) {
        const quest = allQuests[questId];

        // quest already exists in Profile
        const questInProfile = accountMode.characters.pmc.Quests.find((x) => x.qid === quest._id);
        if (questInProfile) {
            playerQuests.push(quest);
            continue;
        }

        if (quest.secretQuest)
            continue;

        if(quest.conditions.AvailableForStart.length === 0) {
            playerQuests.push(quest);
            continue;
        }
    }

    console.log(playerQuests);
    bsgHelper.addBSGBodyInResponseWithData(res, playerQuests);

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
    const db = global._database;
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
    const db = global._database;
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
 * /client/survey:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 41
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/survey', function(req, res, next) {

    const surveyResult = {
        "locale": {
            "en": {
                "question_1": "How off-topic is general chat on the SPT discord?",
                "question_1_answer_1": "Not at all",
                "question_1_answer_2": "A little",
                "question_1_answer_3": "Sometimes",
                "question_1_answer_4": "Somewhat often",
                "question_1_answer_5": "Quite often",
                "question_1_answer_6": "Most of the time",
                "question_1_answer_7": "Almost always",
                "question_1_answer_8": "Always",
                "question_1_answer_9": "NOT OFF TOPIC ENOUGH",
                "question_1_answer_10": "I LIVE TO MAKE GENERAL CHAT OFF TOPIC",
                "question_1_answer_11": "I am posting gifs to general chat as we speak",
                "question_2": "When you download a mod from the hub do you read the readme/mod description?",
                "question_2_answer_1": "What's a description",
                "question_2_answer_2": "I can't read",
                "question_2_answer_3": "I am illiterate",
                "question_2_answer_4": "I am too busy making general chat off-topic to read",
                "question_2_answer_5": "YOU WILL NEVER MAKE ME READ TEXT I WILL ASK IN GENERAL CHAT INSTEAD",
                "title": "Feedback survey",
                "time": "About 1 minute",
                "description": "This is the first SPT survey! Your survey doesn't get sent anywhere, its just for modders to see how it works and maybe make use of.",
                "farewell": "I told you at the start the survey doesn't get sent anywhere and yet you still completed it, curious."
            }
        },
        "survey": {
            "id": 1,
            "welcomePageData": {
                "titleLocaleKey": "title",
                "timeLocaleKey": "time",
                "descriptionLocaleKey": "description"
            },
            "farewellPageData": {
                "textLocaleKey": "farewell"
            },
            "pages": [[0, 1]],
            "questions": [
                {
                    "id": 0,
                    "sortIndex": 1,
                    "titleLocaleKey": "question_1",
                    "hintLocaleKey": "",
                    "answerLimit": 10,
                    "answerType": "MultiOption",
                    "answers": [
                        {
                            "id": 0,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_1"
                        },
                        {
                            "id": 1,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_2"
                        },
                        {
                            "id": 2,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_3"
                        },
                        {
                            "id": 3,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_4"
                        },
                        {
                            "id": 4,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_5"
                        },
                        {
                            "id": 5,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_6"
                        },
                        {
                            "id": 6,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_7"
                        },
                        {
                            "id": 7,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_8"
                        },
                        {
                            "id": 8,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_9"
                        },
                        {
                            "id": 9,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_10"
                        },
                        {
                            "id": 10,
                            "questionId": 0,
                            "sortIndex": 1,
                            "localeKey": "question_1_answer_11"
                        }
                    ]
                },
                {
                    "id": 1,
                    "sortIndex": 1,
                    "titleLocaleKey": "question_2",
                    "hintLocaleKey": "",
                    "answerLimit": 5,
                    "answerType": "SingleOption",
                    "answers": [
                        {
                            "id": 0,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_1"
                        },
                        {
                            "id": 1,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_2"
                        },
                        {
                            "id": 2,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_3"
                        },
                        {
                            "id": 3,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_4"
                        },
                        {
                            "id": 4,
                            "questionId": 1,
                            "sortIndex": 1,
                            "localeKey": "question_2_answer_5"
                        }
                    ]
                }
            ],
            "isNew": false
        }
    };
    bsgHelper.addBSGBodyInResponseWithData(res, surveyResult);

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
 *     summary: Called to check the Version of the game against updates, could be useful for Client updates?
 *     parameters:
 *      - name: id
 *        in: path
 *        description: The language requested
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/items/prices/:id', function(req, res, next) {

    let id = req.params["id"];
    if(id === undefined)
        throw "Expected parameter id";

    /**
     * @type {Database}
     */
    const db = global._database;
    const itemsTemplates = db.getData(db.templates.items);
    const pricesTemplates = db.getData(db.templates.prices);

    let listOfTemplates = Object.values(itemsTemplates).filter((x) => x._type === "Item")
    const prices = {};
    for (const item of listOfTemplates) {

        let price = pricesTemplates[item._id];
        if (!price)
            price = 1;

        prices[item._id] = Math.round(price);
    }
    bsgHelper.addBSGBodyInResponseWithData(res, {
        supplyNextTime: 0,
        prices: prices,
        currencyCourses: {
            "5449016a4bdc2d6f028b456f": prices["5449016a4bdc2d6f028b456f"],
            "569668774bdc2da2298b4568": prices["569668774bdc2da2298b4568"],
            "5696686a4bdc2da3298b456a": prices["5696686a4bdc2da3298b456a"],
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
router.post('/match/local/start', async function(req, res, next) {

    if (!req.body.location)
        throw `expected location in request body`

    const location = req.body.location.toLowerCase();
    if (!Database.locations[location]) {
        console.log(Database.locations);
        throw `${location} doesn't exist in Database.locations`
    }
    const result = new LocalMatchStartResponse(location);

    // generate temporary instance
    let lootGenService = new LootGenerationService();
    // Add Loot
    result.locationLoot.Loot = lootGenService.Generate(result.locationLoot);
    // Release the instance
    delete lootGenService;

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
router.post('/game/bot/generate', function(req, res, next) {

    console.log(req.body);
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
