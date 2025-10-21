var express = require('express');
var router = express.Router();
var { AccountService } = require('../services/accountService');
const { getBody } = require('../bsgHelper');
const { getRenderViewModel, getRenderViewModelWithUsername } = require('../classes/shared');

/**
 * @swagger
 * /user/details/{id}/{mode}:
 *   get:
 *     tags:
 *     - User
 *     summary: Gets the user account data to display on views
 *     parameters:
 *      - name: id
 *        in: path
 *        description: The Account Id
 *        required: true
 *      - name: mode
 *        in: path
 *        description: The Play Mode
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.get('/details/:id/:mode', function(req, res, next) {

    let userAccountId = req.params["id"];
    if(userAccountId === undefined) {
        next();
        return;
    }

    let mode = req.params["mode"];
    if(mode === undefined){
        next();
        return;
    }

    if (!AccountService.accountExists(userAccountId)){
        next();
        return;
    }

    const account = AccountService.getAccount(userAccountId);
    if(account === undefined){
        next();
        return;
    }

    const rvm = getRenderViewModel(req);
    rvm.profile = account.modes[mode];

    res.render('userDetails', rvm);
});

/**
 * @swagger
 * /user/details/:
 *   get:
 *     tags:
 *     - User
 *     summary: Gets the user account data by cookie SessionId to display on views
 *     responses:
 *       200:
 *         description: A successful response
 */
router.get('/details/', function(req, res, next) {

    let userAccountId = req.cookies["PHPSESSID"];
    if(userAccountId === undefined) {
        next();
        return;
    }

    if (!AccountService.accountExists(userAccountId)){
        next();
        return;
    }

    const account = AccountService.getAccount(userAccountId);
    if(account === undefined){
        next();
        return;
    }

    const mode = account.currentMode;
    if (mode === undefined) {
        next();
        return;
    }

    const accountMode = account.modes[mode];
    if (accountMode === undefined) {
        next();
        return;
    }

    const rvm = getRenderViewModelWithUsername(req, account.username);
    rvm.profile = accountMode;

    res.render('userDetails', rvm);
});


module.exports = router;
