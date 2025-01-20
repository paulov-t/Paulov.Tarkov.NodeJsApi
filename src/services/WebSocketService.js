const { ENotificationType } = require('../models/ENotificationType');
const { generateMongoId } = require('./../bsgHelper');

/**
 * A service to retain connections for each user logged in to the App
 */
class WebSocketService {
    constructor() {
        /**
         * 
         */
        this.connections = {};
    }


    /**
     * 
     * @param {*} accountId 
     * @param {*} offerId 
     * @param {*} handbookId 
     * @param {*} count 
     */
    sendRagfairOfferSold(accountId, offerId, handbookId, count) {

        if(WebSocketService.connections[accountId])
            WebSocketService.connections[accountId].socket.send(JSON.stringify(
            { 
                type: ENotificationType.RagfairOfferSold
                , eventId: generateMongoId()
                , offerId: offerId
                , handbookId: handbookId
                , count: count
                , time: 5 
            }));
    }

    /**
     * 
     * @param {*} accountId 
     * @param {*} rating 
     * @param {*} isRatingGrowing 
     */
    sendRagfairNewRating(accountId, rating, isRatingGrowing) {

        if(WebSocketService.connections[accountId])
            WebSocketService.connections[accountId].socket.send(JSON.stringify(
            { 
                type: ENotificationType.RagfairNewRating
                , eventId: generateMongoId()
                , rating: rating
                , isRatingGrowing: isRatingGrowing
                , time: 5 
            }));
    }
}




module.exports.WebSocketService = new WebSocketService();
