var express = require('express');
var fs = require('fs');
var router = express.Router();
var bsgHelper =  require('../../../bsgHelper');
var zlib =  require('zlib');

/**
 * @swagger
 * /client/menu/locale/{lang}:
 *   post:
 *     summary: Load Tarkov Call 1
 *     parameters:
 *      - name: lang
 *        in: path
 *        description: The language requested
 *        required: true
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/locale/:lang', function(req, res, next) {
    let lang = req.params["lang"];
    if(lang === undefined)
        lang = "en";
    
    const entry = global._database["locales"]["menu"][lang];
    /**
     * @type {Database}
     */
    const db = global._database;
    const dbResult = db.getData(entry);

    const bodyResult = { "err": 0, "errmsg": null, "data": dbResult }
    const stringify = JSON.stringify(bodyResult, null, "\t");
    // bsgHelper.addBSGBodyInResponseWithData(res, dbResult);
    // next();
    zlib.deflate(stringify, (err, deflateData) => {
    
        if(req.headers["user-agent"] !== undefined && !(req.headers["user-agent"].startsWith("Unity")))
            res.setHeader("content-encoding", "deflate");

        res.setHeader("content-type", "application/json");

        res.send(deflateData);

    });
});



module.exports = router;