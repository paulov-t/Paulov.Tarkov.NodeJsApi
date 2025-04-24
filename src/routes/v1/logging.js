const LoggingHistoryEntry = require("../../models/LoggingHistoryEntry");
const LoggingService = require("../../services/LoggingService");
const bsgHelper = require('../../bsgHelper');
var express = require('express');
var router = express.Router();

/**
 * @swagger
 * /v1/logging/getTodaysLog/:
 *   post:
 *     tags:
 *     - Logging
 *     summary: Gets a history of logs from today
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getTodaysLog/', async function(req, res, next) {
    
    const logHistory = LoggingService.getHistoryFromToday();
    if (logHistory.length === 0) {
        bsgHelper.getBody(res, "Not_Found");
        return;
    }

    if(logHistory)
        bsgHelper.getBody(res, logHistory);
    else
        bsgHelper.getBody(res, "Not_Found");

    next();
});


module.exports = router;