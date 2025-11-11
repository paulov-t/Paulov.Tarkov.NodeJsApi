const { Account, AccountProfileCharacterQuestItem } = require("../models/account");
var { AccountService } = require('./AccountService');
const { getBody } = require('../bsgHelper');
const { getRenderViewModel, getRenderViewModelWithUsername } = require('../classes/shared');
const { Database } = require('../classes/database');
var bsgHelper =  require('../bsgHelper');
const LoggingService = require('./LoggingService');
const { SocialNetworkService } = require('./SocialNetworkService');
const { Message } = require("../models/Message");
const { EMessageType } = require("../models/Enums/EMessageType");
const { mongoid } = require("mongoid-js");
const { DatabaseService } = require('./DatabaseService');
const { MessageItemsModel } = require("../models/MessageItemsModel");

class QuestService {
    constructor() {
    }

    /**
     * 
     * @param {Account} account 
     * @returns 
     */
    getAllQuestsForAccount(account) {
        
        const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
        const playerQuests = [];
        const pmcProfile = accountMode.characters.pmc;
        const allQuests = Database.getTemplateQuests();

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
                        LoggingService.logError(`profileQuest ${quest.QuestName} doesn't exist.`);

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
        
        return playerQuests;
    
    }

    acceptQuestForAccount(account, questId, outputChanges) {

        if (questId === undefined) {
            throw new Error("Quest ID is undefined. Cannot accept quest.");
        }

        if (typeof(questId) !== 'string') {
            throw new Error("Quest ID is not a string. Cannot accept quest.");
        }

        const result = { success: true, error: undefined };
    
        const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
        const pmcProfile = accountProfile.characters.pmc;
        const allQuests = Database.getTemplateQuests();
        const questToAccept = allQuests[questId];
        if (questToAccept) {
            LoggingService.logInfo(`Accepting ${questToAccept._id}`);
            const index = pmcProfile.Quests.findIndex(x => x.qid === questToAccept._id);
            if (index === -1) {
                LoggingService.logWarning(`Could not find ${questToAccept._id}. Adding the item.`);
                let profileQuestItem = new AccountProfileCharacterQuestItem();
                profileQuestItem.qid = questToAccept._id;
                profileQuestItem.startTime = Math.round(Date.now() / 1000);
                pmcProfile.Quests.push(profileQuestItem);

                
            }
            else {
                let profileQuestItem = pmcProfile.Quests[index];
                LoggingService.logDebug(`Found ${questToAccept._id} at index ${index}`);
                if (profileQuestItem) {
                    profileQuestItem.status = "Started";
                }
            }
    
            this.sendStartedMessageToClient(account, questToAccept);
    
        }
    
        return result;
    }

    /**
     * 
     * @param {Account} account 
     * @param {*} quest 
     */
    sendStartedMessageToClient(account, quest) {

        /**
         * @type {Database}
         */
        const db = DatabaseService.getDatabase();
        const localeEntries = db["locales"];
        const localeEntry = localeEntries.global['en'];
        const localeDb = db.getData(localeEntry);
        const messageText = localeDb[quest.startedMessageText] !== undefined ? localeDb[quest.startedMessageText] : localeDb[quest.description];
        if (messageText) {
            const startedRewards = quest.rewards.Started;
            const items = [];
            for (const reward of startedRewards) {
                for (const item of reward.items) {
                    items.push(item);
                }
            }
            const message = new Message(quest.traderId);
            message.type = EMessageType.QuestStart;
            message.text = messageText;
            message.items = new MessageItemsModel(quest.traderId, items);
            message.hasRewards = message.items.data.length > 0;
            message.uid = quest.traderId
            SocialNetworkService.sendMessageToAccount(quest.traderId, account.accountId, account.currentMode, message, items);
        }

    }

}

module.exports.QuestService = new QuestService();
