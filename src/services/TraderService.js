const { generateMongoId } = require("../bsgHelper");
const { AccountProfileCharacter } = require("../models/account");
const { ECurrencyTemplates } = require("../models/Enums/ECurrencyTemplates");
const { AccountService } = require("./accountService");
const { ContainerService } = require("./ContainerService");
const { InventoryService } = require("./InventoryService");
const { DatabaseService } = require("./DatabaseService");
const { BuyFromTraderAction } = require("../models/ItemMovingActions/BuyFromTraderAction");
const bsgHelper = require("./../bsgHelper");
const LoggingService = require("./LoggingService");

/**
 * A service for anything trader or "ragfair" (flea market) related
 */
class TraderService {
    constructor() {
        
    }

    /**
     * Get trader data by TraderId. Returns the base data (name etc) and assort data (items for sale).
     * @param {String} traderId 
     */
    getTrader(traderId) {

        if (!traderId)
            throw "parameter traderId is undefined";

         /**
         * @type {Database}
         */
        const db = DatabaseService.getDatabase();
        const traderEntry = db["traders"][traderId];
        const baseEntry = traderEntry.base;
        const assortEntry = traderEntry.assort;

        const traderDataBaseResult = db.getData(baseEntry);
        /**
         * @type {TraderAssort}
         */
        const traderDataAssortResult = db.getData(assortEntry);

        if (!traderDataBaseResult || !traderDataAssortResult) {
            return undefined;
        }

        return {
            base: traderDataBaseResult,
            assort: traderDataAssortResult
        }
    }

    /**
     * 
     * @param {String} traderId 
     * @param {Number} amount 
     * @param {AccountProfileCharacter} accountProfileCharacter 
     * @param {Object} profileChanges 
     * @returns {Boolean} Successfulness of the Transaction
     */
    givePlayerMoneyFromTrader(traderId, amount, accountProfileCharacter, profileChanges) {

        if(amount < 1)
            throw "parameter amount less than 1";

        const trader = this.getTrader(traderId);
        if (!trader)
            return false;

        const currencyTemplateId = ECurrencyTemplates[trader.base.currency];
        if (!currencyTemplateId)
            return false;

        const templateItem = InventoryService.getTemplateItem(currencyTemplateId);
        if (!templateItem)
            return false;

        const currencyMaxStackSize = templateItem._props?.StackMaxSize;
        if (!currencyMaxStackSize)
            return false;

        const stashId = accountProfileCharacter.Inventory.stash;

        const newCurrentItem = {
            _id: generateMongoId(),
            _tpl: currencyTemplateId,
            upd: { StackObjectsCount: Math.round(amount) },
            slotId: 'hideout',
            parentId: stashId
        };

        if (!newCurrentItem)
            return;

        const stashContainerMap = InventoryService.getStashContainerMap(accountProfileCharacter);
        const placementResult = ContainerService
                                .findSpotForItem(stashContainerMap,
                                    templateItem._props.Width,
                                    templateItem._props.Height
                                );

        if(placementResult && placementResult.success) {
            newCurrentItem.location = {};
            newCurrentItem.location.x = placementResult.x;
            newCurrentItem.location.y = placementResult.y;
            newCurrentItem.location.r = !placementResult.rotation ? 0 : 1,
            newCurrentItem.location.rotation = placementResult.rotation 
        }

        // Finally
        // , add the item to the Client callback
        profileChanges.items.new.push(newCurrentItem);
        // , add the item to the Server record
        accountProfileCharacter.Inventory.items.push(newCurrentItem);

        return placementResult;

    }

    /**
     * 
     * @param {Account} account 
     * @param {BuyFromTraderAction} action 
     * @returns 
     */
    buyFromTrader(account, action, outputChanges) {
        const result = { success: true, error: undefined };
    
        const Database = DatabaseService.getDatabase();
        const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
        const pmcProfile = accountProfile.characters.pmc;
        const inventoryEquipmentId = pmcProfile.Inventory.equipment;
        const inventoryItems = pmcProfile.Inventory.items;
    
        const traderId = action.tid;
        const trader = this.getTrader(traderId);
        const templatePrices = DatabaseService.getDatabase().getData(Database.templates.prices);
    
        const userItemsToUse = action.scheme_items;
        const buyingItemId = action.item_id;
        // const template = DatabaseService.getDatabase().getTemplateItems()[buyingItemId];
    
        let moneySalesSum = 0;
    
        const itemsToRemoveFromInventory = [];
        for(const userItemToUse of userItemsToUse) {

            const foundItemIndex = inventoryItems.findIndex(x => userItemToUse.id == x._id);
            if (foundItemIndex === -1) {
                let invItems = inventoryItems.filter(x => userItemToUse.id == x._tpl);
                console.log(invItems);
            }
            const invItem = inventoryItems.find(x => userItemToUse.id == x._id || userItemToUse.id == x._tpl);
            if (!invItem) {
                LoggingService.logError(`TraderService.buyFromTrader: Item with id ${userItemToUse.id} not found in inventory`);
                // If the item is not found in the inventory, we return an error
                result.success = false;
                result.error = `Item with id ${userItemToUse.id} not found in inventory`;
                return result;
            }
            // console.log(invItem);
            // A stack of something, likely money in this case
            if (invItem.upd && invItem.upd.StackObjectsCount) {
                invItem.StackObjectsCount -= userItemToUse.count;
                if (invItem.upd.StackObjectsCount <= 0)
                    itemsToRemoveFromInventory.push(invItem);
    
                moneySalesSum += userItemToUse.count;
    
            } else {
                itemsToRemoveFromInventory.push(invItem);
            }
    
        }
    
        // Remove the items from the Inventory
        for(const item of itemsToRemoveFromInventory) {
            const indexToRemove = inventoryItems.findIndex(x => x._id === item._id);
            if (indexToRemove !== -1)
                inventoryItems.splice(indexToRemove, 1);
        }
    
        const clonedParentItem = JSON.parse(JSON.stringify(trader.assort.items.find(x => x._id == action.item_id)));
        clonedParentItem._id = bsgHelper.generateMongoId();
        clonedParentItem.parentId = undefined;
        const newParentItemId = clonedParentItem._id;
        clonedParentItem.upd = {};
    
        const childItems = InventoryService.findChildItemsOfItemId(trader.assort.items, action.item_id, false);
        if (childItems && childItems.length > 0) {
            // Buy and Transfer the item from Trader to Player
            for(const item of childItems) {
                
                const clonedItem = JSON.parse(JSON.stringify(item));
                clonedItem.parentId = newParentItemId;
                clonedItem._id = bsgHelper.generateMongoId();
                InventoryService.placeItemIntoPlayerStash(accountProfile.characters.pmc, clonedItem);
    
                // console.log(clonedItem);
    
                inventoryItems.push(indexToRemove, 1);
            }
        }
        else {
            if(InventoryService.placeItemIntoPlayerStash(accountProfile.characters.pmc, clonedParentItem)) {
    
                if (!outputChanges.profileChanges[pmcProfile._id].items.new)
                    outputChanges.profileChanges[pmcProfile._id].items.new = [];
    
                const itemToSendBack = JSON.parse(JSON.stringify(clonedParentItem));
                // itemToSendBack.id = itemToSendBack._id;
                itemToSendBack.parent = itemToSendBack.parentId;
                itemToSendBack.slot = itemToSendBack.slotId;
                console.log(itemToSendBack);
    
                outputChanges.profileChanges[pmcProfile._id].items.new.push(itemToSendBack);
            }
        }
    
        if (moneySalesSum) {
            pmcProfile.TradersInfo[traderId].salesSum += this.convertToCurrencyMoney(moneySalesSum, 'RUB', trader.base.currency)
            pmcProfile.TradersInfo[traderId].salesSum = Math.round(pmcProfile.TradersInfo[traderId].salesSum);
        }
    
        return result;
    }

    
    sellToTrader(account, action, outputChanges) {
        const result = { success: true, error: undefined };

        const accountProfile = AccountService.getAccountProfileByCurrentModeFromAccount(account);
        const pmcProfile = accountProfile.characters.pmc;
        const inventoryEquipmentId = pmcProfile.Inventory.equipment;
        const inventory = pmcProfile.Inventory.items;

        const traderId = action.tid;
        const trader = this.getTrader(traderId);
        const Database = DatabaseService.getDatabase();
        const templatePrices = DatabaseService.getDatabase().getData(Database.templates.prices);
        // console.log(templatePrices);

        let money = 0;
        for (const sellItem of action.items) {

            const itemsInInventory = inventory.filter(x => x._id == sellItem.id || x.parentId == sellItem.id);
            for(const itemInInventory of itemsInInventory) {
                if (!itemInInventory)
                    continue;

                if (itemInInventory._id === inventoryEquipmentId)
                    continue;

                // This will remove the item from the Client.
                if (itemInInventory.slotId == 'hideout') {
                    if (typeof outputChanges.profileChanges[pmcProfile._id].items.del === "undefined") 
                        outputChanges.profileChanges[pmcProfile._id].items.del = [];

                    outputChanges.profileChanges[pmcProfile._id].items.del.push(itemInInventory);
                }

                if (!templatePrices[itemInInventory._tpl])
                    continue;

                const templatePrice = templatePrices[itemInInventory._tpl];
                let priceCoef = (trader.base.loyaltyLevels[0].buy_price_coef) / 100;
                let price = templatePrice >= 1 ? templatePrice : 1;
                let count =
                    "upd" in itemInInventory && "StackObjectsCount" in itemInInventory.upd
                    ? itemInInventory.upd.StackObjectsCount
                    : 1;
                price = ((price - (price * priceCoef)) * count);
                price = this.convertToCurrencyMoney(price, 'RUB', trader.base.currency)

                money += price;

                // This will remove the item from the Server.
                InventoryService.removeItemAndChildItemsFromProfile(pmcProfile, itemInInventory._id);
            }

        }

        this.givePlayerMoneyFromTrader(traderId, money, pmcProfile, outputChanges.profileChanges[pmcProfile._id]);
        pmcProfile.TradersInfo[traderId].salesSum += money;

        return result;
    }

    updateTraderRelations(account) {

        const accountMode = AccountService.getAccountProfileByCurrentModeFromAccount(account);
        for( const traderId in accountMode.characters.pmc.TradersInfo) {
                const traderInfo = accountMode.characters.pmc.TradersInfo[traderId];
                
                if (traderInfo.salesSum < 0) {
                    traderInfo.salesSum = 0;
                }
                traderInfo.salesSum = Math.round(traderInfo.salesSum);
            }

            const result = {};
            for (const traderId in accountMode.characters.pmc.TradersInfo) {
                const baseData = accountMode.characters.pmc.TradersInfo[traderId];
                result[traderId] = {
                    salesSum: baseData.salesSum,
                    disabled: baseData.disabled,
                    loyalty: baseData.loyaltyLevel,
                    standing: baseData.standing,
                    unlocked: baseData.unlocked,
                };
        }
        return result;
    }

    getTraderPrices(traderId) {

        const db = DatabaseService.getDatabase();
        const itemsTemplates = db.getData(db.templates.items);
        const pricesTemplates = db.getData(db.templates.prices);
    
        let listOfTemplates = Object.values(itemsTemplates).filter((x) => x._type === "Item")
        const prices = {};
        for (const item of listOfTemplates) {
    
            let price = pricesTemplates[item._id];
            if (!price) {
                price = 1;
            }
    
            prices[item._id] = Math.ceil(price);
        }
    
        const trader = this.getTrader(traderId);
        if (trader.base.currency === 'USD') {
            for (const priceId in prices) {
                prices[priceId] *= 0.013;
                prices[priceId] = Math.ceil(prices[priceId]);
            }
        }
        else if (trader.base.currency === 'EUR') {
            for (const priceId in prices) {
                prices[priceId] *= 0.011;
                prices[priceId] = Math.ceil(prices[priceId]);
            }
        }
        else if (trader.base.currency === 'GP') {
            for (const priceId in prices) {
                prices[priceId] *= 0.001;
                prices[priceId] = Math.ceil(prices[priceId]);
            }
        }
    
        const coef = (100 - trader.base.loyaltyLevels[0].buy_price_coef) * 0.01;
        for (const priceId in prices) {
            prices[priceId] *= coef;
            prices[priceId] = Math.ceil(prices[priceId]);
        }
    
        for (const priceId in prices) {
            if (prices[priceId] === 0) {
                prices[priceId] = 1;
            }
        }
        return prices;
    }

    convertToCurrencyMoney(money, fromCurrency, toCurrency) {
        let amount = money;
        switch (fromCurrency) {
            case 'RUB':
                switch (toCurrency) {
                    case 'USD':
                        amount *= 0.013;
                        break;
                    case 'EUR':
                        amount *= 0.011;
                        break;
                    case 'GP':
                        amount *= 0.001;
                        break;
                }
                break;
        }
        amount = Math.ceil(amount);
        return amount;
    }

}

module.exports.TraderService = new TraderService();