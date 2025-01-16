var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
var { Database } = require('./../classes/database');

/**
 * @swagger
 * /itemSearch/getItemEnglishNameAndTpl/:
 *   post:
 *     tags:
 *     - Item Search
 *     summary: Search the Items Database by Tpl
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getItemEnglishNameAndTpl/', function(req, res, next) {
    
    // console.log(req.body);
    /**
     * @type {Database}
     */
    const db = global._database;
    // console.log(db);
    const languageLocaleData = db.getData(global._database["locales"]["global"]["en"]);
    const templatesItemData = db.getData(global._database["templates"]["items"]);
    
    const result = [];
    // console.log(languageLocaleData);
    // console.log(templatesItemData);
    for(const itemId in templatesItemData) {
        const item = templatesItemData[itemId];
        const name = item._name;
        let langItem = languageLocaleData[`${itemId} Name`];
        if (!langItem)
            langItem = languageLocaleData[`${itemId} ShortName`];

        if (!langItem)
            langItem = item._name;

        if (!item)
            continue;
        
        let parentIdLang = languageLocaleData[`${item._parent} Name`];
        if (!parentIdLang)
            parentIdLang = "N/A";
        
        result.push({
            itemId: itemId,
            langItem: langItem,
            parentId: item._parent,
            parentIdLang: parentIdLang
        });
    }

    if(result)
    {
        bsgHelper.getBody(res, result);
    }
    else
        bsgHelper.getBody(res, "Not_Found");

    next();
});

/**
 * @swagger
 * /itemSearch/getAmmo/:
 *   post:
 *     tags:
 *     - Item Search
 *     summary: Gets a list of Ammo
 *     responses:
 *       200:
 *         description: A successful response
 */
router.post('/getAmmo/', function(req, res, next) {
    
    
    const db = Database;
    // console.log(db);
    const languageLocaleData = db.getData(global._database["locales"]["global"]["en"]);
    const templatesItemData = db.getData(global._database["templates"]["items"]);
    
    let result = [];
    // console.log(languageLocaleData);
    // console.log(templatesItemData);
    for(const itemId in templatesItemData) {
        const item = templatesItemData[itemId];
        const name = item._name;

        if (!item)
            continue;

        if (item._parent !== '5485a8684bdc2da71d8b4567')
            continue;

        if (!item._props)
            continue;

        if (item._props.ammoType !== 'bullet')
            continue;

        let langItem = languageLocaleData[`${itemId} Name`];
        if (!langItem)
            langItem = languageLocaleData[`${itemId} ShortName`];

        if (!langItem)
            langItem = item._name;
        
        let parentIdLang = languageLocaleData[`${item._parent} Name`];
        if (!parentIdLang)
            parentIdLang = "N/A";
        
        result.push({
            itemId: itemId,
            langItem: langItem,
            caliber: item._props.Caliber,
            armorDamage: item._props.ArmorDamage,
            penetration: item._props.PenetrationPower,
            damage: item._props.Damage,
            rating: item._props.ArmorDamage * item._props.PenetrationPower * item._props.Damage
        });
    }


    if(result)
    {
        result = result.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        bsgHelper.getBody(res, result);
    }
    else
        bsgHelper.getBody(res, "Not_Found");

    next();
});

/**
 * @swagger
 * /itemSearch/itemSearchByTpl/{tpl}:
 *   post:
 *     tags:
 *     - Item Search
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
    
    /**
     * @type {Database}
     */
    const db = global._database;
    const templatesItems = db.getData(global._database["templates"]["items"]);
    const dbResult = templatesItems[tpl];
    if(dbResult)
        bsgHelper.getBody(res, dbResult);
    else 
        bsgHelper.getBody(res, "Not_Found");

    next();
});

module.exports = router;