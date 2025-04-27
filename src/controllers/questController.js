var express = require('express');
var router = express.Router();
var { AccountService } = require('../services/AccountService');
const { getBody } = require('../bsgHelper');
const { getRenderViewModel, getRenderViewModelWithUsername } = require('../classes/shared');
const { Database } = require('../classes/database');
var bsgHelper =  require('../bsgHelper');

/**
 * @swagger
 * /client/quest/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 37
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/list', function(req, res, next) {

    const allQuests = Database.getTemplateQuests();
    let account = AccountService.getAccount(req.SessionId);
    if (!account)
        account = AccountService.getAllAccounts()[0];


    const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
    const playerQuests = [];
    const pmcProfile = accountMode.characters.pmc;

    for (const questId in allQuests) {
        const quest = allQuests[questId];

        // if (quest.QuestName === 'Shortage') {
        //     console.log(quest);
        // }

        // quest already exists in Profile
        const questInProfile = accountMode.characters.pmc.Quests.find((x) => x.qid === quest._id);
        if (questInProfile) {
            playerQuests.push(quest);
            continue;
        }

        if (quest.secretQuest)
            continue;

        if(quest.conditions.AvailableForStart.length === 0) {
            playerQuests.push(quest);
            continue;
        }

        if(quest.conditions.AvailableForStart.length > 0) {
            let available = true;
            // console.log(quest.conditions.AvailableForStart);
            // console.log(quest.QuestName);

            for(const afsCondition of quest.conditions.AvailableForStart) {
                // console.log(afsCondition);
                if(afsCondition.conditionType) {
                    switch (afsCondition.conditionType) {
                        case 'Quest':
                            if (allQuests[afsCondition.target]) {

                                const targetQuest = allQuests[afsCondition.target];
                                if (!targetQuest)
                                    continue;

                                const profileQuest = pmcProfile.Quests.find(x => x.qid == targetQuest._id);
                                if (!profileQuest)
                                    available = false;
                                else {
                                    if(profileQuest.status !== "Success") {
                                        available = false;
                                    }
                                }
                            }
                            break;
                        case 'Level':
                            switch (afsCondition.compareMethod) {
                                case '>=':
                                    if (pmcProfile.Info.Level < afsCondition.value)
                                        available = false;
                                    break;
                            }
                            break;
                    }
                }
            }

            if(available) {
                const profileQuest = pmcProfile.Quests.find(x => x.qid == quest._id);
                if (profileQuest) {
                    if (profileQuest.status != EQuestStatus.AvailableForStart)
                        profileQuest.status = EQuestStatus.AvailableForStart;
                }
                else {
                    logger.logError(`profileQuest ${quest.QuestName} doesn't exist.`);

                }
                playerQuests.push(quest);
            }
            continue;
        }
    }

    // console.log(playerQuests);

    let updatedQuests = false;
    for(const quest of playerQuests) {

        const questInProfile = accountMode.characters.pmc.Quests.find((x) => x.qid === quest._id);
        if(!questInProfile) {
            
            let playerQuestInProfile = new AccountProfileCharacterQuestItem();
            playerQuestInProfile.qid = quest._id;
            // console.log(quest);
            accountMode.characters.pmc.Quests.push(playerQuestInProfile);
            updatedQuests = true;
        }
    }

    if(updatedQuests)
        AccountService.saveAccount(account);
    
    bsgHelper.addBSGBodyInResponseWithData(res, playerQuests);

    next();
});

module.exports = router;
