var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');

/**
 * @swagger
 * /itemSearch/itemSearchByTpl/{tpl}:
 *   post:
 *     summary: Search the Items Database by Tpl
 *     parameters:
 *      - name: tpl
 *        in: path
 *        description: The Item Tpl
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/itemSearchByTpl/:tpl', function(req, res, next) {
    let tpl = req.params["tpl"];
    if(tpl === undefined)
        throw "tpl not provided"
    
    const dbResult = global._database["templates"]["items"][tpl];
    res.json(dbResult);
});

module.exports = router;