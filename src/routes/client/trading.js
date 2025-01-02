var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../../bsgHelper');

/**
 * @swagger
 * /client/trading/api/getTraderAssort/{traderId}:
 *   post:
 *     summary: 
 *     parameters:
 *      - name: traderId
 *        in: path
 *        description: The TraderId
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getTraderAssort/:traderId', function(req, res, next) {
    let traderId = req.params["traderId"];
    if(traderId === undefined)
        throw "traderId not provided"
    
    /**
     * @type {Database}
     */
    const db = global._database;
    const traderEntry = db["traders"][traderId];
    const assortEntry = traderEntry.assort;
    const dbResult = db.getData(assortEntry);
    dbResult.nextResupply = Math.floor((Date.now() / 1000) + 1000);
    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    
    next();
});

module.exports = router;