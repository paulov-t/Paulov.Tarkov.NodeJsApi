
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
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                default: L33tS0ld13r
 *              pwd:
 *                type: string
 *                default: l33tg0ld3nm4n
 *     responses:
 *       200:
 *         description: A successful response
 *       401:
 *         description: A unauthorized response
 */
router.post('/login', function(req, res, next) {

    if (req.body.username && req.body.pwd) { 
        const account = AccountService.getAccountByUsernamePassword(req.body.username, req.body.pwd);
        if(account) {
            const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
            let options = {
                maxAge: 8 * 60 * 60 * 1000, // would expire in 8 hours
                httpOnly: false, // The cookie is only accessible by the web server
                secure: true,
                sameSite: "None",
            };
            res.cookie('PHPSESSID', account.accountId, options);
            res.redirect(`../../user/details/${account.accountId}/${accountMode.name}`);
            return;
        }
    }

    res.status(401).render('unauthorized', { });

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
