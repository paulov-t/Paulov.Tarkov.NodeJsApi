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
    
    const dbResult = JSON.parse(JSON.stringify(global._database["traders"][traderId])).assort;
    dbResult.nextResupply = Math.floor((Date.now() / 1000) + 1000);
    bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    
    next();
});

module.exports = router;