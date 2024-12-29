var express = require('express');
var router = express.Router();
var bsgHelper =  require('../../bsgHelper');

/**
 * @swagger
 * /client/locale/{lang}:
 *   post:
 *     summary: Tarkov Call 1
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

    bsgHelper.addBSGBodyInResponseWithData(res, global._database["locales/global"][lang]);
    next();
});

module.exports = router;
