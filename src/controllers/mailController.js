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

  const account = AccountService.getAccount(req.SessionId);
  const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);

  const dialogId = requestBody.dialogId;
  if (!dialogId) {
    bsgHelper.getBody(res, { error: 'Dialog ID is required' });
    return next();
  }
  const dialogue = accountProfile.socialNetwork.dialogues.find(d => d._id === dialogId);
  if (!dialogue) {
    bsgHelper.getBody(res, { error: 'Dialogue not found' });
    return next();
  }

  bsgHelper.getBody(res,  {
    messages: dialogue.messages,
    profiles: [],
    hasMessagesWithRewards: true,
  });
  
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


 /**
 * @swagger
 * /client/mail/dialog/getAllAttachments:
 *   post:
 *     tags:
 *     - Mail
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/dialog/getAllAttachments', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);

  bsgHelper.nullResponse(res);

  next();
});


module.exports = router;