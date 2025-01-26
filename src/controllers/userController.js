var express = require('express');
var router = express.Router();
var { AccountService } = require('../services/AccountService');
const { getBody } = require('../bsgHelper');

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

    res.render('userDetails', { profile: account.modes[mode] });
});


module.exports = router;
