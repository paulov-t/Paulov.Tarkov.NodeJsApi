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
}

module.exports.TraderService = new TraderService();