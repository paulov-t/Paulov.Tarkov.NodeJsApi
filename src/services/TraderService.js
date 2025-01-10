const { generateMongoId } = require("../bsgHelper");
const { AccountProfileCharacter } = require("../models/Account");
const { ECurrencyTemplates } = require("../models/Enums/ECurrencyTemplates");
const { AccountService } = require("./AccountService");
const { InventoryService } = require("./InventoryService");

class TraderService {
    constructor() {
        
    }

    /**
     * 
     * @param {String} traderId 
     */
    getTrader(traderId) {

         /**
         * @type {Database}
         */
        const db = global._database;
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

        const newCurrentItem = {
            _id: generateMongoId(),
            _tpl: currencyTemplateId,
            upd: { StackObjectsCount: Math.round(amount) },
        };

        if (!newCurrentItem)
            return;

        const stashId = InventoryService.getPlayerStashId(accountProfileCharacter);
        const playerStashXandY = InventoryService
                                .getPlayerStashSizeXAndY(
                                    accountProfileCharacter);
        const placementResult = InventoryService
                                .placeItemIn2dContainer(
                                    stashId
                                    , playerStashXandY
                                    , accountProfileCharacter.Inventory.items
                                    , newCurrentItem);

        return placementResult;

    }

}

module.exports.TraderService = new TraderService();