var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
var tarkovSend =  require('./../tarkovSend');

/**
 * @swagger
 * /launcher/server/connect:
 *   post:
 *     summary: Launcher call 1. Attempt to Connect to this Server.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/server/connect', function(req, res, next) {
    bsgHelper.addBSGBodyInResponseWithData(res, null)
    next();
});

/**
 * @swagger
 * /launcher/ping:
 *   post:
 *     summary: Launcher call 2. Attempt to Ping this Server.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/ping', function(req, res, next) {
    bsgHelper.addBSGBodyInResponseWithData(res, null)
    next();
});

/**
 * @swagger
 * /launcher/profile/login:
 *   post:
 *     summary: Launcher call 3. Attempt to Login to this Server.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/profile/login', function(req, res, next) {

    // tarkovSend.TarkovSend.zlibJson(res, "", null, req)
    // res.json("INVALID_PASSWORD");
    // bsgHelper.addBSGBodyInResponseWithData(res, "INVALID_PASSWORD");
    res.body = bsgHelper.generateMongoId();
    next();
});

module.exports = router;