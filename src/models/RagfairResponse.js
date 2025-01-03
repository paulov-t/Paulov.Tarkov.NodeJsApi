const { RagfairOffer } = require('./RagfairModels');

class RagfairResponse {
    constructor() {
        /**
         * @type {RagfairOffer[]}
         */
        this.offers = [];
        /**
         * @type {Number}
         */
        this.offersCount = 1;
        /**
         * @type {String}
         */
        this.selectedCategory = "";
    }

}

module.exports.RagfairResponse = RagfairResponse;
