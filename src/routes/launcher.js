var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
var tarkovSend =  require('./../tarkovSend');
const { AccountService } = require('../services/AccountService');

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
 *     tags:
 *     - Launcher
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
 *     tags:
 *     - Launcher
 *     summary: Launcher call 3. Attempt to Login to this Server.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/profile/login', function(req, res, next) {

    generateLauncherLoginRequestBodyForSwagger(req);

    const account = AccountService.getAccountByUsernamePassword(req.body.username, req.body.password);
    // Account has not been found. Send back a "FAILED" notification.
    if (account === undefined || account === null) {
        res.body = "FAILED";
        next();
        return;
    }

    // Account has been found but the provided password is invalid. Send back a "INVALID_PASSWORD" notification.
    if (account === "INVALID_PASSWORD") {
        res.body = "INVALID_PASSWORD";
        next();
        return;
    }

    res.body = account.accountId;
    next();
});

/**
 * @swagger
 * /launcher/profile/register:
 *   post:
 *     tags:
 *     - Launcher
 *     summary: Launcher call 3. Attempt to Login to this Server.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/profile/register', function(req, res, next) {
    generateLauncherLoginRequestBodyForSwagger(req);

    const account = AccountService.createAccount(req.body, undefined, true);
    res.body = account.accountId;
    next();
});

function generateLauncherLoginRequestBodyForSwagger (req) {
    if (req.body.username === undefined) {
        req.body.username = "testSwagger";
    }

    if (req.body.password === undefined) {
        req.body.password = "testSwagger";
    }
}

module.exports = router;