const { AccountService } = require('./../services/accountService');
const { BuyFromTraderAction, BuyFromTraderActionSchemeItem } = require('../models/ItemMovingActions/BuyFromTraderAction');
const { ActionCommandsService } = require('../services/ActionCommandsService');
const { TraderService } = require('./../services/TraderService');

test('Buying a random item from a Prapor', () => {
     
    const allAccounts = AccountService.getAllAccounts();
    if (allAccounts.length === 0) {
        console.log('No accounts found');
        return;
    }
    const account = allAccounts[0];
    if (!account) {
        console.log('No account found');
        return;
    }

    const outputChanges = ActionCommandsService.createActionCommandOutput(account, AccountService.getAccountProfileByCurrentModeFromAccount(account));
    if (!outputChanges) {
        console.log('No output changes found');
        return;
    }
    
    const traderId = '54cb50c76803fa8b248b4571'; // Prapor's trader ID
    const trader = TraderService.getTrader(traderId); // Prapor's trader ID
    const itemId = trader.assort.items[0]._id;
    /**
     * @type {BuyFromTraderActionSchemeItem[]}
     */
    const scheme_items = [];
    for (let schem of trader.assort.barter_scheme[itemId]) {
        for (let inner of schem) {
            scheme_items.push(new BuyFromTraderActionSchemeItem(inner._tpl, inner.count));
        }
    }
    const buyFromTraderAction = new BuyFromTraderAction(1
        , itemId
        , traderId
        , scheme_items);
    expect(TraderService.buyFromTrader(allAccounts[0], buyFromTraderAction, outputChanges).success).toBe(true);  
});