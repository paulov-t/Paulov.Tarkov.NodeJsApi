/**
 * The C part of MVC for Match Controller. (client/mail routes)
 * /client/mail
 */

var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { AccountService } = require('./../services/AccountService');
const { Account, AccountProfileMode } = require('./../models/Account');
const { Database } = require('./../classes/database');
const { FriendRequest } = require('./../models/FriendRequest');
const { UpdatableChatMember } = require('./../models/UpdatableChatMemberInfo');

/**
 * @swagger
 * /client/mail/dialog/view:
 *   post:
 *     tags:
 *     - Mail
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/dialog/view', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);

  const sessionId = req.SessionId;

  bsgHelper.getBody(res, {});
  
  next();
});

/**
 * @swagger
 * /client/mail/msg/send:
 *   post:
 *     tags:
 *     - Mail
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/msg/send', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
  
    const sessionId = req.SessionId;
  
    bsgHelper.getBody(res, {});
    
    next();
  });


module.exports = router;