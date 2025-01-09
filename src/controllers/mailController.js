var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { AccountService } = require('./../services/AccountService');
const { BotGenerationService, BotGenerationCondition } = require('./../services/BotGenerationService');
const { Account, AccountProfileMode } = require('./../models/Account');
const { Database } = require('./../classes/database');
const { FriendRequest } = require('./../models/FriendRequest');
const { UpdatableChatMember } = require('./../models/UpdatableChatMemberInfo');

router.post('/dialog/view', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);

  const sessionId = req.SessionId;

  bsgHelper.getBody(res, {});
  
  next();
});

router.post('/msg/send', function(req, res, next) {

    const requestBody = req.body;
    console.log(requestBody);
  
    const sessionId = req.SessionId;
  
    bsgHelper.getBody(res, {});
    
    next();
  });


module.exports = router;