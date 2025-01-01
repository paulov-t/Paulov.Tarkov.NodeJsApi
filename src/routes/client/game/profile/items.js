const express = require('express');
const router = express.Router();
const bsgHelper =  require('../../../../bsgHelper')

/**
 * @swagger
 * /client/game/profile/items/moving:
 *   post:
 *     summary: Called when moving items around in your stash or completing tasks
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/moving', function(req, res, next) {

    const sessionId = req.SessionId;

    if (!req.body.data) {
        
    }

    /**
     * Example of data
     * data: [{ }]
     * reload: 16
     * tm: 13
     */
    let bodyActionList = req.body.data;
    for(const action in bodyActionList) {

    }

    const result = {
        warnings: [],
        profileChanges: {}
    }
    bsgHelper.addBSGBodyInResponseWithData(res, result);

    next();
});

module.exports = router;
