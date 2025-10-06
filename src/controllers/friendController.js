var express = require('express');
var router = express.Router();
var bsgHelper =  require('../bsgHelper');
const { AccountService } = require('../services/accountService');
const { BotGenerationService } = require('../services/BotGenerationService');
const { Account, AccountProfileMode } = require('../models/account');
const { Database } = require('../classes/database');
const { FriendRequest } = require('../models/FriendRequest');
const { UpdatableChatMember } = require('../models/UpdatableChatMember');
const { UpdatableChatMemberInfo } = require('../models/UpdatableChatMemberInfo');
const { ProfileStatus } = require('../models/profileStatus');
const { WebSocketService } = require('../services/WebSocketService');
const { ENotificationType } = require('../models/ENotificationType');
const { SocialNetworkService } = require('../services/SocialNetworkService');

/**
 * @swagger
 * /client/friend/list:
 *   post:
 *     tags:
 *     - Friend
 *     summary: Tarkov Call 33
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/list', function(req, res, next) {

  const friends = [];
  friends.push();

  const sessionId = req.SessionId;
  const myAccount = AccountService.getAccount(sessionId);
  const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);

  // Null guard. Create friends if it doesn't exist.
  if (!myAccountByMode.socialNetwork.friends)
    myAccountByMode.socialNetwork.friends = [];

  for(const fr of myAccountByMode.socialNetwork.friends) {
    const otherAccount = AccountService.getAccount(fr);
    const otherAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(otherAccount);
    friends.push(AccountService.getChatMemberProfile(otherAccount, myAccount.currentMode));
  }
   
  bsgHelper.getBody(res, { Friends: friends, Ignore: [], InIgnoreList: [] });

  next();
});

/**
 * @swagger
 * /client/friend/request/send:
 *   post:
 *     tags:
 *     - Friend
 *     summary: 
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - to
 *            properties:
 *              to:
 *                type: string
 *                default: ""
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/request/send', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);

  const sessionId = req.SessionId;

  if (!sessionId || !requestBody.to) {
    bsgHelper.getBody(res, { error: "SessionId or 'to' field is missing." });
    next();
    return;
  }

  const myAccount = AccountService.getAccount(sessionId);
  const otherAccount = AccountService.getAccount(requestBody.to);

  const friendRequest = new FriendRequest();
  friendRequest.from = myAccount.accountId;
  friendRequest.to = otherAccount.accountId;
  friendRequest.date = new Date().getTime();
  const senderAccountCurrentMode = myAccount.currentMode;
  const myAccountByCurrentMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
  myAccountByCurrentMode.socialNetwork.friendRequestOutbox.push(friendRequest);
  AccountService.saveAccount(myAccount);
  otherAccount.modes[senderAccountCurrentMode].socialNetwork.friendRequestInbox.push(friendRequest);
  AccountService.saveAccount(otherAccount);

  if(WebSocketService.connections[otherAccount.accountId])
    WebSocketService.connections[otherAccount.accountId].socket.send(JSON.stringify({ type: ENotificationType.FriendsListNewRequest, eventId: "FriendsListNewRequest", time: 5 }));

  bsgHelper.addBSGBodyInResponseWithData(res, 
    { 
      requestId: friendRequest._id,
      retryAfter: undefined,
      status: "None"
    });
  
  next();
});

/**
 * @swagger
 * /client/friend/request/list/outbox:
 *   post:
 *     tags:
 *     - Friend
 *     summary: Client function GetOutputFriendsRequests 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/request/list/outbox', function(req, res, next) {

  const requestBody = req.body;

  const sessionId = req.SessionId !== undefined ? req.SessionId : '677bdee7668e28b53c000151';
  const myAccount = AccountService.getAccount(sessionId);
  const myAccountByMode = AccountService.getAccountProfileByCurrentMode(sessionId);
  if (!myAccountByMode || !myAccountByMode.socialNetwork || !myAccountByMode.socialNetwork.friendRequestOutbox)
  {
    bsgHelper.getBody(res, []);
    next();
    return;
  }

 const testResultArray = [];
for(const outboxObj of myAccountByMode.socialNetwork.friendRequestOutbox) { 
  console.log(outboxObj);

  const otherAccount = AccountService.getAccount(outboxObj.to);
  testResultArray.push( 
  {
    _id: bsgHelper.generateMongoId(),
    from: outboxObj.from,
    to: outboxObj.to,
    date: outboxObj.date,
    profile: AccountService.getChatMemberProfile(otherAccount)
  });
}
  // const outboxResult = myAccountByMode.socialNetwork.friendRequestOutbox;

  // NOTE: Keep this. It works.
// const testResultArray = [];
// testResultArray.push( 
//  {
//   _id: bsgHelper.generateMongoId(),
//   from: myAccount.accountId,
//   to: myAccount.accountId,
//   date: new Date().getTime(),
//   profile: AccountService.getChatMemberProfile(myAccount)
//  }

// );

  bsgHelper.getBody(res, testResultArray);
  next();
});

/**
 * @swagger
 * /client/friend/request/list/inbox:
 *   post:
 *     tags:
 *     - Friend
 *     summary: 
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/request/list/inbox', function(req, res, next) {

  const requestBody = req.body;
  const sessionId = req.SessionId;
  const myAccount = AccountService.getAccount(sessionId);
  const myAccountByMode = AccountService.getAccountProfileByCurrentMode(sessionId);

  const testResultArray = [];
for(const outboxObj of myAccountByMode.socialNetwork.friendRequestInbox) { 
  console.log(outboxObj);

  const otherAccount = AccountService.getAccount(outboxObj.from);
  testResultArray.push( 
  {
    _id: bsgHelper.generateMongoId(),
    from: outboxObj.from,
    to: outboxObj.to,
    date: outboxObj.date,
    profile: AccountService.getChatMemberProfile(otherAccount)
  });
}

  bsgHelper.getBody(res, testResultArray);

 
  
  next();
});

/**
 * @swagger
 * /client/friend/request/accept:
 *   post:
 *     tags:
 *     - Friend
 *     summary: body with profileId
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           type: object
 *           properties:
 *            profileId:
 *              type: string
 *              default: 677bdee7668e28b53c000151
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/request/accept', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);
  const sessionId = req.SessionId;
  if (!sessionId) {
    next();
    return;
  }
  const myAccount = AccountService.getAccount(sessionId);
  if (!myAccount) {
    next();
    return;
  }
  const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
  if (!myAccountByMode) {
    next();
    return;
  }

  // Ensure friends exists
  if (!myAccountByMode.socialNetwork.friends)
    myAccountByMode.socialNetwork.friends = [];

  if (myAccountByMode.socialNetwork.friends.indexOf(x => x == requestBody.profileId) === -1)
    myAccountByMode.socialNetwork.friends.push(requestBody.profileId);

  const index = myAccountByMode.socialNetwork.friendRequestInbox.findIndex((v) => { return v.from == requestBody.profileId; });
  if (index != -1)
    myAccountByMode.socialNetwork.friendRequestInbox.splice(index, 1);

  AccountService.saveAccount(myAccount);


  // Now we handle the friendship requester
  const otherAccount = AccountService.getAccount(requestBody.profileId);
  if (!otherAccount) {
    next();
    return;
  }
  const otherAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(otherAccount);
  if (!otherAccountByMode) {
    next();
    return;
  }

  // Ensure friends exists
  if (!otherAccountByMode.socialNetwork.friends)
    otherAccountByMode.socialNetwork.friends = [];

  if (otherAccountByMode.socialNetwork.friends.indexOf(x => x == requestBody.profileId) === -1)
    otherAccountByMode.socialNetwork.friends.push(requestBody.profileId);

  const indexOtherAccount = otherAccountByMode.socialNetwork.friendRequestOutbox.findIndex((v) => { return v.from == requestBody.profileId; });
  if (indexOtherAccount != -1)
    otherAccountByMode.socialNetwork.friendRequestOutbox.splice(index, 1);

  AccountService.saveAccount(otherAccount);

  bsgHelper.getBody(res, {});
  
  next();
});

router.post('/request/accept-all', function(req, res, next) {

  const requestBody = req.body;
  console.log(requestBody);
  const sessionId = req.SessionId;
  if (!sessionId) {
    next();
    return;
  }
  const myAccount = AccountService.getAccount(sessionId);
  if (!myAccount) {
    next();
    return;
  }
  const myAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(myAccount);
  if (!myAccountByMode) {
    next();
    return;
  }

  SocialNetworkService.addAllFriends(myAccount);

  // Now we handle the friendship requester
  const otherAccount = AccountService.getAccount(requestBody.profileId);
  if (!otherAccount) {
    next();
    return;
  }
  const otherAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(otherAccount);
  if (!otherAccountByMode) {
    next();
    return;
  }

  // Ensure friends exists
  if (!otherAccountByMode.socialNetwork.friends)
    otherAccountByMode.socialNetwork.friends = [];

  if (otherAccountByMode.socialNetwork.friends.indexOf(x => x == requestBody.profileId) === -1)
    otherAccountByMode.socialNetwork.friends.push(requestBody.profileId);

  const indexOtherAccount = otherAccountByMode.socialNetwork.friendRequestOutbox.findIndex((v) => { return v.from == requestBody.profileId; });
  if (indexOtherAccount != -1)
    otherAccountByMode.socialNetwork.friendRequestOutbox.splice(index, 1);

  AccountService.saveAccount(otherAccount);

  bsgHelper.getBody(res, {});
  
  next();
});

module.exports = router;
