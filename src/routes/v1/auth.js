
var express = require('express');
const { AccountService } = require('../../services/AccountService');
var router = express.Router();

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     tags:
 *     - Authorization
 *     summary: Attempts to login
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/login', function(req, res, next) {

    if (req.body.username && req.body.pwd) { 
        const account = AccountService.getAccountByUsernamePassword(req.body.username, req.body.pwd);
        if(account) {
            const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
            res.redirect(`../../user/details/${account.accountId}/${accountMode.name}`);
            return;
        }
    }

    res.render('unauthorized', { });

});

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     tags:
 *     - Authorization
 *     summary: Attempts to login
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/register', function(req, res, next) {

    res.render('unauthorized', { });
    next();

});

module.exports = router;
