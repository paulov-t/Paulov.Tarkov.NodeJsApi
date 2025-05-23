var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { LocationService } = require('../services/LocationService');
const { DatabaseService } = require('../services/DatabaseService');

/**
 * @swagger
 * /client/hideout/areas:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 24
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/areas', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbAreas = db.getData(db.hideout.areas);
    if(!dbAreas)
        throw "Hideout Areas not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbAreas);

    next();
});

/**
 * @swagger
 * /client/hideout/qte/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 25
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/qte/list', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbHideoutQte = db.getData(db.hideout.qte);
    if(!dbHideoutQte)
        throw "Hideout QTE not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutQte);

    next();
});

/**
 * @swagger
 * /client/hideout/settings:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 26
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/settings', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbHideoutSettings = db.getData(db.hideout.settings);
    if(!dbHideoutSettings)
        throw "Hideout Settings not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutSettings);

    next();
});

/**
 * @swagger
 * /client/hideout/production/recipes:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 27
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/production/recipes', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbHideoutProduction = db.getData(db.hideout.production);
    if(!dbHideoutProduction)
        throw "Hideout Production not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutProduction);

    next();
});

/**
 * @swagger
 * /client/hideout/customization/offer/list:
 *   post:
 *     tags:
 *     - Client
 *     summary: Tarkov Call 28
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/customization/offer/list', function(req, res, next) {

    /**
     * @type {Database}
     */
    const db = DatabaseService.getDatabase();
    const dbHideoutCustomisation = db.getData(db.hideout.customisation);
    if(!dbHideoutCustomisation)
        throw "Hideout Customisation not found";

    bsgHelper.addBSGBodyInResponseWithData(res, dbHideoutCustomisation);

    next();
});

module.exports = router;
