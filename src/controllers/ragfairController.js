var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { Database } = require('./../classes/database');
const { Account, AccountProfileMode } = require('../models/Account');
const { AccountService } = require('../services/AccountService');
const { TraderAssort } = require('../models/TraderAssort');
const { RagfairResponse } = require('../models/RagfairResponse');
const { RagfairOffer } = require('../models/RagfairModels');

/**
 * @swagger
 * /client/ragfair/find:
 *   post:
 *     tags:
 *     - Ragfair
 *     summary: 
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - page
 *            properties:
 *              page:
 *                type: number
 *                default: 0
 *              limit:
 *                type: number
 *                default: 15
 *              sortType:
 *                type: number
 *                default: 5
 *              sortDirection:
 *                type: number
 *                default: 0
 *              currency:
 *                type: number
 *                default: 0
 *              priceFrom:
 *                type: number
 *                default: 0
 *              priceTo:
 *                type: number
 *                default: 0
 *              quantityFrom:
 *                type: number
 *                default: 0
 *              quantityTo:
 *                type: number
 *                default: 0
 *              conditionFrom:
 *                type: number
 *                default: 100
 *              conditionTo:
 *                type: number
 *                default: 100
 *              oneHourExpiration:
 *                type: boolean
 *                default: false
 *              removeBartering:
 *                type: boolean
 *                default: false
 *              offerOwnerType:
 *                type: number
 *                default: 0
 *              onlyFunctional:
 *                type: boolean
 *                default: true
 *              updateOfferCount:
 *                type: boolean
 *                default: true
 *              handbookId:
 *                type: string
 *                default: '5b5f78dc86f77409407a7f8e'
 *              linkedSearchId:
 *                type: string
 *                default: ''
 *              neededSearchId:
 *                type: string
 *                default: ''
 *              buildItems:
 *                type: object
 *                default: {}
 *              buildCount:
 *                type: number
 *                default: 0
 *              tm:
 *                type: number
 *                default: 18
 *              reload:
 *                type: number
 *                default: 11
 *     responses:
*        200:
*           description: Fetched Successfully
*        400:
*           description: Bad Request
*        404:
*           description: Not Found
*        500:
*           description: Server Error
 */
router.post('/find', function(req, res, next) {

    const searchRequest = req.body;
    console.log(searchRequest);

    let account = AccountService.getAccount(req.SessionId);
        // if we are running via Swagger UI and SessionId is null. Get first account to test with.
        if(!req.SessionId) {
            const allAccounts = AccountService.getAllAccounts();
            account = allAccounts.find(x => x.accountId.length > 0 && x.modes[x.currentMode].characters !== undefined && x.modes[x.currentMode].characters.pmc !== undefined);
        }
    
    const profile = AccountService.getAccountProfileByCurrentMode(account.accountId);

    /**
     * @type {Database}
     */
    const db = Database;
    const result = new RagfairResponse();

    const handbookData = db.getData(db.templates.handbook);

    /**
     * @type {string[]}
     */
    let itemsToSort = [];

    /**
     * @type {string[]}
     */
    let itemsToResult = [];
    // Request is a weapon build
    if (req.body.buildCount) {
        itemsToSort = Object.keys(req.body.buildItems);
    }

    // Request is a linked Search
    if (searchRequest.linkedSearchId) {
        // const data = this.ragfairLinkedItemService.getLinkedItems(request.linkedSearchId);
        // result = !data ? [] : [...data];
    }

    // Request is a Category click
    if (searchRequest.handbookId) {
        const isCategory = handbookData.Categories.findIndex(x => x.Id == searchRequest.handbookId);
        if(isCategory) {
            result.selectedCategory = searchRequest.handbookId;
        }

        const handbook = getCategoryListByHandbookId(handbookData, searchRequest.handbookId);
        if (result.length) {
            // result = this.utilityHelper.arrayIntersect(result, handbook);
        } else {
            itemsToResult = handbook;
        }
    }

    const traderEntries = db["traders"];
    for (const traderEntryId in traderEntries) {
        const traderAssortEntry = traderEntries[traderEntryId].assort;
        if (!traderAssortEntry)
            continue;

        const traderAssortData = db.getData(traderAssortEntry);
        if(traderAssortData) {
            const traderItems = traderAssortData.items.filter(x=> itemsToResult.includes(x._tpl));
            // console.log(traderAssortData);
            // console.log(traderItems);
            for(const item of traderItems)
                result.offers.push(createRagfairOfferForItem(item));
        }
    }

    // provide total count of offers before paging
    result.offersCount = result.offers.length;

    // if we are not providing a build, page the result set
    if (searchRequest.buildCount === 0) {
        const start = searchRequest.page * searchRequest.limit;
        const end = Math.min((searchRequest.page + 1) * searchRequest.limit, result.offers.length);
        result.offers = result.offers.slice(start, end);
    }

    console.log(result);
    bsgHelper.addBSGBodyInResponseWithData(res, result);
    
    next();
});

/**
 * Gets a list of category by handbookId
 * @param {object} handbookData 
 * @param {string} handbookId 
 * @returns {string[]}
 */
function getCategoryListByHandbookId(handbookData, handbookId) {
    /**
     * @type {string[]}
     */
    let result = [];

    if (handbookId === "5b5f71a686f77447ed5636ab") {
        // for (const categ of this.handbookHelper.childrenCategories(handbookId)) {
        //     for (const subcateg of this.handbookHelper.childrenCategories(categ)) {
        //         result = [...result, ...this.handbookHelper.templatesWithParent(subcateg)];
        //     }
        // }

        return result;
    }

    const isCategory = handbookData.Categories.findIndex(x => x.Id == handbookId);
    if (isCategory) {
        const handbookItems = handbookData.Items;
        result = handbookItems.map(
                function(x) 
                { 
                    return x.Id;
                });
        // .filter(x => x.ParentId == handbookId).map(
        //     function(x) 
        //     { 
        //         return x.Id;
        //     });
        // for (const categoryId of handbookData.Categories.filter(x => result.includes(x.ParentId))) {
        //     result = [...result, ...handbookItems.filter(x => x.ParentId == categoryId).map(
        //         function(x) 
        //         { 
        //             return x.Id;
        //         })];
        // }

        return result;
    }

    // its a specific item searched
    result.push(handbookId);
    return result;
}

global.offerIdCounter = 0;
/**
 * 
 * @param {any} item 
 * @returns {RagfairOffer} offer
 */
function createRagfairOfferForItem(item) {

    const ragfairOffer = new RagfairOffer();
    ragfairOffer._id = bsgHelper.generateMongoId();
    ragfairOffer.intId = ++global.offerIdCounter;
    ragfairOffer.items.push(item);
    ragfairOffer.root = ragfairOffer.items[0]._id;
    ragfairOffer.sellInOnePiece = false;
    ragfairOffer.startTime = (Date.now() / 1000)
    ragfairOffer.endTime = (Date.now() / 1000) + 1000;
    ragfairOffer.locked = false;

    return ragfairOffer;
}

module.exports = router;