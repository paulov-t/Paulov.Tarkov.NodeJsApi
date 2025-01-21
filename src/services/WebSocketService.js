const { AccountService } = require('./AccountService');
const { ENotificationType } = require('../models/ENotificationType');
const { generateMongoId } = require('./../bsgHelper');

/**
 * A service to retain connections for each user logged in to the App
 */
class WebSocketService {
    constructor() {
        /**
         * 
         */
        this.connections = {};
    }


    /**
     * 
     * @param {*} accountId 
     * @param {*} offerId 
     * @param {*} handbookId 
     * @param {*} count 
     */
    sendRagfairOfferSold(accountId, offerId, handbookId, count) {

        if(this.connections[accountId])
          this.connections[accountId].socket.send(JSON.stringify(
            { 
                type: ENotificationType.RagfairOfferSold
                , eventId: generateMongoId()
                , offerId: offerId
                , handbookId: handbookId
                , count: count
                , time: 5 
            }));
    }

    /**
     * 
     * @param {*} accountId 
     * @param {*} rating 
     * @param {*} isRatingGrowing 
     */
    sendRagfairNewRating(accountId, rating, isRatingGrowing) {

        if(this.connections[accountId])
          this.connections[accountId].socket.send(JSON.stringify(
            { 
                type: ENotificationType.RagfairNewRating
                , eventId: generateMongoId()
                , rating: rating
                , isRatingGrowing: isRatingGrowing
                , time: 5 
            }));
    }

    sendUserConfirmed(accountId, rating, isRatingGrowing) {
        /*
        {
  "type": "userConfirmed",
  "eventId": "{mongoid}",
  "profileid": "",
  "profileToken": "",
  "status": "Busy",
  "ip": "",
  "port": ,
  "sid": "",
  "version": "live",
  "location": "TarkovStreets",
  "raidMode": "Online",
  "mode": "deathmatch",
  "shortId": "",
  "additional_info": []
}
        */
    }

    /**
     * Send a group invite to "accountToSendToId" which will trigger a popup for that player
     * @param {string} accountToSendToId 
     * @param {string} fromMemberAccountId 
     * @param {string[]} memberIds
     */
    sendGroupMatchInviteSend(accountToSendToId, fromMemberAccountId, memberIds) {


      const accountFrom = AccountService.getAccount(fromMemberAccountId);
      const accountFromByMode = AccountService.getAccountProfileByCurrentModeFromAccount(accountFrom);

      const accountToSendTo = AccountService.getAccount(accountToSendToId);
      const accountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(accountToSendTo);

      const members = [];
      // Add self
      const contentSelf = {
        "_id": accountFromByMode.characters.pmc._id,
        "aid": accountFromByMode.characters.pmc.aid,
        "Info": accountFromByMode.characters.pmc.Info,
        "isLeader": true,
        "isReady": false,
        "PlayerVisualRepresentation": null
      }
      members.push(contentSelf);

      for (const memberId of memberIds) {
        const memberAccount = AccountService.getAccount(memberId);
        const memberAccountByMode = AccountService.getAccountProfileByCurrentModeFromAccount(memberAccount);
        const bodyOfMember = memberAccountByMode.characters.pmc;
        const contentMember = {
            "_id": bodyOfMember._id,
            "aid": bodyOfMember.aid,
            "Info": bodyOfMember.Info,
            "isLeader": false,
            "isReady": false,
            "PlayerVisualRepresentation": null
          }
        members.push(contentMember);
      }
      const contentToSend = {
        "type": "groupMatchInviteSend",
        "eventId": accountByMode.socialNetwork.groupInvite.eventId,
        "requestId": accountByMode.socialNetwork.groupInvite.eventId,
        "from": accountFromByMode.characters.pmc.aid,
        members: members,
        "isLeader": false,
        "isReady": false,
      }


      if(this.connections[accountToSendToId])
        this.connections[accountToSendToId].socket.send(JSON.stringify(contentToSend));


        /*
        {
  "type": "groupMatchInviteSend",
  "eventId": "",
  "requestId": "",
  "from": "",
  "members": [
    {
      "_id": "",
      "aid": 0,
      "Info": {
        "Nickname": "",
        "Side": "Usec",
        "Level": 23,
        "MemberCategory": 0,
        "SelectedMemberCategory": 0,
        "GameVersion": "standard",
        "SavageLockTime": 0,
        "SavageNickname": "",
        "Health": {
          "Hydration": {
            "Current": 100,
            "Maximum": 100
          },
          "Energy": {
            "Current": 100,
            "Maximum": 100
          },
          "Temperature": {
            "Current": 36.6,
            "Maximum": 40
          },
          "BodyParts": {
            "Head": {
              "Health": {
                "Current": 35,
                "Maximum": 35
              }
            },
            "Chest": {
              "Health": {
                "Current": 85,
                "Maximum": 85
              }
            },
            "Stomach": {
              "Health": {
                "Current": 70,
                "Maximum": 70
              }
            },
            "LeftArm": {
              "Health": {
                "Current": 60,
                "Maximum": 60
              }
            },
            "RightArm": {
              "Health": {
                "Current": 60,
                "Maximum": 60
              }
            },
            "LeftLeg": {
              "Health": {
                "Current": 65,
                "Maximum": 65
              }
            },
            "RightLeg": {
              "Health": {
                "Current": 65,
                "Maximum": 65
              }
            }
          },
          "UpdateTime": 1733344728,
          "Immortal": false
        }
      },
      "isLeader": false,
      "isReady": false,
      "PlayerVisualRepresentation": null
    }
  ]
}
        */
    }

        /**
     * 
     * @param {string} accountId 
     */
        sendGroupMatchRaidSettings(accountId, raidSettings) {

          const contentToSend = {
            "type": "groupMatchRaidSettings",
            "eventId": generateMongoId(),
            "raidSettings": {
              "location": "Interchange",
              "timeVariant": "CURR",
              "raidMode": "Online",
              "metabolismDisabled": false,
              "playersSpawnPlace": "SamePlace",
              "timeAndWeatherSettings": {
                "isRandomTime": false,
                "isRandomWeather": false,
                "cloudinessType": "Clear",
                "rainType": "NoRain",
                "fogType": "NoFog",
                "windType": "Light",
                "timeFlowType": "x1",
                "hourOfDay": -1
              },
              "botSettings": {
                "isScavWars": false,
                "botAmount": "AsOnline"
              },
              "wavesSettings": {
                "botAmount": "AsOnline",
                "botDifficulty": "AsOnline",
                "isBosses": true,
                "isTaggedAndCursed": false
              },
              "side": "Pmc",
              "isLocationTransition": true
            }
          }

          if(this.connections[accountId])
            this.connections[accountId].socket.send(JSON.stringify(contentToSend));

            /*
            {
  "type": "groupMatchRaidSettings",
  "eventId": "",
  "raidSettings": {
    "location": "Interchange",
    "timeVariant": "CURR",
    "raidMode": "Online",
    "metabolismDisabled": false,
    "playersSpawnPlace": "SamePlace",
    "timeAndWeatherSettings": {
      "isRandomTime": false,
      "isRandomWeather": false,
      "cloudinessType": "Clear",
      "rainType": "NoRain",
      "fogType": "NoFog",
      "windType": "Light",
      "timeFlowType": "x1",
      "hourOfDay": -1
    },
    "botSettings": {
      "isScavWars": false,
      "botAmount": "AsOnline"
    },
    "wavesSettings": {
      "botAmount": "AsOnline",
      "botDifficulty": "AsOnline",
      "isBosses": true,
      "isTaggedAndCursed": false
    },
    "side": "Pmc",
    "isLocationTransition": true
  }
}
            */
       
       
        }

        sendGroupMatchStartGame(accountId, groupId) {
/*
{
  "type": "groupMatchStartGame",
  "eventId": "",
  "groupId": ""
}
*/
        }

        sendGroupMatchRaidReady(accountId) {
            /*
            {
                "type": "groupMatchRaidReady",
  "eventId": "",
  "extendedProfile": this is the whole profile
            */
        }
}




module.exports.WebSocketService = new WebSocketService();
