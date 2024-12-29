var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');

/**
 * @swagger
 * /client/locale/{lang}:
 *   post:
 *     summary: Tarkov Call 1
 *     parameters:
 *      - name: lang
 *        in: path
 *        description: The language requested
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/locale/:lang', function(req, res, next) {

    let lang = req.params["lang"];
    if(lang === undefined)
        lang = "en";

    bsgHelper.addBSGBodyInResponseWithData(res, global._database["locales/global"][lang]);
    next();
});

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
    bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: "Pve", backendUrl: req.host });
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
    bsgHelper.addBSGBodyInResponseWithData(res, null);
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

module.exports = router;
