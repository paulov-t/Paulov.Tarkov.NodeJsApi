var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');



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
    bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: "pve", backendUrl: req.host });
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

    bsgHelper.addBSGBodyInResponseWithData(res, global._database["locales"]["languages"]);
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

    bsgHelper.addBSGBodyInResponseWithData(res, global._database["templates"]["items"]);
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

    const templateCustomization = global._database["templates"]["customization"];
    bsgHelper.getBody(res, templateCustomization);
    // console.log(templateCustomization);
    // console.log(res.body);
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
   const storage = global._database["templates"]["customizationStorage"];
    bsgHelper.addBSGBodyInResponseWithData(res, storage);
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
    const globals = global._database["globals"];
    globals.time = Date.now() / 1000;

    bsgHelper.addBSGBodyInResponseWithData(res, globals);
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

    bsgHelper.addBSGBodyInResponseWithData(res, global._database["settings"]);
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
   const prestige = global._database["templates"]["prestige"];
   bsgHelper.addBSGBodyInResponseWithData(res, prestige);
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

    const traders = global._database["traders"];
    const traderBases = [];
    for (const traderId in traders) {
        traderBases.push(traders[traderId].base);
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
    const output = [];
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

    const locales = global._database["locales"];
    const result = locales.global[lang];

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

module.exports = router;
