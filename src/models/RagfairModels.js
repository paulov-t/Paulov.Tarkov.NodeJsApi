class RagfairOffer {
    constructor() {

        this.sellResult = [];
        this._id = "";
        this.items = [];
        this.requirements = [];
        this.root = "";
        this.intId = 0;
        /**
         * Handbook price
         * @type {Number}
         */
        this.itemsCost = 0;
        /** Rouble price per item */
        this.requirementsCost = 0;
        this.startTime = 0;
        this.endTime = 0;
        /** True when offer is sold as pack */
        this.sellInOnePiece = false;
        /** Rouble price - same as requirementsCost */
        this.summaryCost = 0;
        this.user = {};

        /**
         * @type {boolean}
         */
        this.unlimitedCount = false;
        /**
         * @type {number}
         */
        this.loyaltyLevel = 1;
        /**
         * @type {number}
         */
        this.buyRestrictionMax = 1;
        /**
         * @type {number}
         */
        this.buyRestrictionCurrent = 1;
        /**
         * @type {boolean}
         */
        this.locked = false;
    }

}

module.exports.RagfairOffer = RagfairOffer;

