
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Paulov TWS' });
});

/**
 * @swagger
 * /client/game/mode:
 *   post:
 *     summary: Tarkov Call 2
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/client/game/mode', function(req, res, next) {
  bsgHelper.addBSGBodyInResponseWithData(res, { gameMode: "Pve", backendUrl: req.host });
  next();
});

/**
 * @swagger
 * /client/game/start:
 *   post:
 *     summary: Tarkov Call 3
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/client/game/start', function(req, res, next) {
  const today = new Date().toUTCString();
  const startTimeStampMS = Date.parse(today);
  bsgHelper.addBSGBodyInResponseWithData(res, { utc_time: startTimeStampMS / 1000 });
  next();

});

/**
 * @swagger
 * /client/game/version/validate:
 *   post:
 *     summary: Call 2 by BSG.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/client/game/version/validate', function(req, res, next) {
  bsgHelper.addBSGBodyInResponseWithData(res, null);
  next();

});

/**
 * @swagger
 * /client/game/config:
 *   post:
 *     summary: 
 *      Call 3 by BSG. 
 *      Gets the Config object with the Uri for Lobby, Trading, Messages, Main and Ragfair
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/client/game/config', function(req, res, next) {
  bsgHelper.addBSGBodyInResponseWithData(res, null);
  next();

});

module.exports = router;
