var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { LocationService } = require('../services/LocationService');

/**
 * @swagger
 * /client/locations:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 22 - Get all location data
 *     description: This endpoint is used to get all location data.
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/', function(req, res, next) {

    bsgHelper.addBSGBodyInResponseWithData(res, new LocationService().getAllLocationData());

    next();
});

module.exports = router;
