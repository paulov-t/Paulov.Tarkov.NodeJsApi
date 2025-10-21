const { AccountService } = require('./../services/accountService');
const { QuestService } = require('./../services/QuestService');

test('Accepting quest and sending message', () => {
    
    const allAccounts = AccountService.getAllAccounts();
    if (allAccounts.length === 0) {
        console.log('No accounts found');
        return;
    }


    const allQuests = QuestService.getAllQuestsForAccount(allAccounts[0]);
    expect(allQuests.length).toBeGreaterThan(0);
    console.log(allAccounts[0]);

    const quest = allQuests.filter((x) => x.rewards.Started.length > 0)[0];
    console.log(quest);
    const questId = quest._id;

    QuestService.acceptQuestForAccount(allAccounts[0], questId, {});


    // expect(calculator.add('1')).toBe(1);
});