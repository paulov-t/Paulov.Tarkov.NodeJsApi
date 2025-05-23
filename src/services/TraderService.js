const { generateMongoId } = require("../bsgHelper");
const { AccountProfileCharacter } = require("../models/Account");
const { ECurrencyTemplates } = require("../models/Enums/ECurrencyTemplates");
const { AccountService } = require("./AccountService");
const { ContainerService } = require("./ContainerService");
const { InventoryService } = require("./InventoryService");
const { DatabaseService } = require("./DatabaseService");

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

}

module.exports.TraderService = new TraderService();