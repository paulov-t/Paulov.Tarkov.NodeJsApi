var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');
const { AccountService } = require('../../services/AccountService');
const { ProfileStatus } = require('../../models/ProfileStatus');
const { ProfileStatusResponse } = require('../../models/ProfileStatusResponse');
const { Account, AccountProfileMode } = require('../../models/Account');



/**
 * @swagger
 * /client/game/mode:
 *   post:
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
    // bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: "pve", backendUrl: req.host });
    next();
  });

  /**
 * @swagger
 * /client/game/start:
 *   post:
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
   *     summary: Load Tarkov Call 6
   *     responses:
   *       200:
   *         description: A successful response
   */
router.post('/game/config', function(req, res, next) {

    const sessionId = req.SessionId;


    const today = new Date().toUTCString();
    const startTimeStampMS = Date.parse(today);
    bsgHelper.addBSGBodyInResponseWithData(res, 
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
            backend: {
                Main: req.host,
                Messaging: req.host,
                Trading: req.host,
                RagFair: req.host,
                Lobby: req.host
            }
        });
    next();

});

/**
 * @swagger
 * /client/items:
 *   post:
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
 * /client/game/profile/list:
 *   post:
 *     summary: Load Tarkov Call 14
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/list', function(req, res, next) {

    const sessionId = req.SessionId;
    if (sessionId === undefined)
        throw "SessionId is not defined!";

    const output = [];
    /**
     * @type {AccountProfileMode}
     */
    const accountProfileByMode = sessionId !== undefined ? AccountService.getAccountProfileByCurrentMode(sessionId) : new Account();
    if (accountProfileByMode.characters.pmc !== undefined) {
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
 * /client/locale/{lang}:
 *   post:
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
 *     summary: Tarkov Call 16
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/nickname/reserved', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, "Hello");
    next();
});

/**
 * @swagger
 * /client/game/profile/nickname/validate:
 *   post:
 *     summary: Tarkov Call 17
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/game/profile/nickname/validate', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { status: "ok" });
    next();
});

/**
 * @swagger
 * /client/game/profile/create:
 *   post:
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

    bsgHelper.addBSGBodyInResponseWithData(res, result);
    next();
});

/**
 * @swagger
 * /client/locations:
 *   post:
 *     summary: Tarkov Call 22
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/locations', function(req, res, next) {

    const locations = {};
    /**
     * @type {Database}
     */
    const db = global._database;
    const locationEntries = db["locations"];
    for(const locationId in locationEntries) {

        const entry = locationEntries[locationId];
        if (!entry)
            continue;

        if (!entry.base)
            continue;

        const mapBase = db.getData(entry.base);
        if (!mapBase) {
            continue;
        }

         // Clear out loot array
         mapBase.Loot = [];
         // Add map base data to dictionary
         locations[mapBase._Id] = mapBase;
    }

    bsgHelper.addBSGBodyInResponseWithData(res, { locations: locations, paths: db.getData(db.locations.base).paths });

    next();
});

/**
 * @swagger
 * /client/handbook/templates:
 *   post:
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
 * /client/match/group/current:
 *   post:
 *     summary: Tarkov Call 32
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/match/group/current', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { squad: [] });

    next();
});

/**
 * @swagger
 * /client/friend/list:
 *   post:
 *     summary: Tarkov Call 33
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/friend/list', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { Friends: [], Ignore: [], InIgnoreList: [] });

    next();
});

/**
 * @swagger
 * /client/friend/request/list/inbox:
 *   post:
 *     summary: Tarkov Call 34
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/friend/request/list/inbox', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, []);

    next();
});

/**
 * @swagger
 * /client/friend/request/list/outbox:
 *   post:
 *     summary: Tarkov Call 35
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/friend/request/list/outbox', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, []);

    next();
});

/**
 * @swagger
 * /client/mail/dialog/list:
 *   post:
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
 *     summary: Tarkov Call 37
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/quest/list', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, []);

    next();
});

/**
 * @swagger
 * /client/achievement/statistic:
 *   post:
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
 * /client/match/group/invite/cancel-all:
 *   post:
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/match/group/invite/cancel-all', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, { });

    next();
});

module.exports = router;
