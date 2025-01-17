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
 *     summary: Get the items table in English and their price
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
    const templatesPricesData = db.getData(global._database["templates"]["prices"]);
    let highestPrice = 0;
    for(const itemId in templatesPricesData)
    {
        if (templatesPricesData[itemId] > highestPrice)
            highestPrice = templatesPricesData[itemId];
    }
    
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

        let price = Database.getTemplateItemPrice(itemId);
        let priceRatio = 0;
        if (price > 0) {
            priceRatio = Math.ceil((price / highestPrice) * 100);
            priceRatio *= 3;
            if(item._props.RarityPvE) {
                switch(item._props.RarityPvE)
                {
                    case 'Superrare':
                        priceRatio *= 3;
                        break;
                    case 'Rare':
                        priceRatio *= 2.75;
                        break;
                    // Common
                    case 'Common':
                        priceRatio *= 2.5;
                        break;
                    // Not exist is loot table specific
                    case 'Not_exist':
                        priceRatio *= 3;
                        break;
                    default:
                        priceRatio *= 2.5;
                        break;
                }
            }
            priceRatio = Math.min(priceRatio, 100);
            priceRatio = Math.max(priceRatio, 1);
            priceRatio = Math.ceil(priceRatio);
        }
        
        
        result.push({
            itemId: itemId,
            langItem: langItem,
            parentId: item._parent,
            parentIdLang: parentIdLang,
            price: price,
            priceRatio: priceRatio
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
    
    function calcAmmo(item) {
        return (item._props.ArmorDamage * 1.25) * (item._props.PenetrationPower * 1.25) * (item._props.Damage * 0.5);
    }


    const db = Database;
    // console.log(db);
    const languageLocaleData = db.getData(global._database["locales"]["global"]["en"]);
    const templatesItemData = db.getData(global._database["templates"]["items"]);

    const ammoParentId = '5485a8684bdc2da71d8b4567';
    const ammoIdsToIgnore = ['5996f6d686f77467977ba6cc', '5d2f2ab648f03550091993ca', '5cde8864d7f00c0010373be1'];

    let highestRating = 0;
    for(const itemId in templatesItemData)
    {
        const item = templatesItemData[itemId];
        if (item._parent !== ammoParentId)
            continue;

        if (ammoIdsToIgnore.findIndex(x => x == itemId) !== -1)
            continue;

        const calc = calcAmmo(item);
        if (calc > highestRating)
            highestRating = calc;
    }
    
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

        if (ammoIdsToIgnore.findIndex(x => x == itemId) !== -1)
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

        const calc = calcAmmo(item);
        const rating = Math.round((calc / highestRating) * 100);
        
        result.push({
            itemId: itemId,
            langItem: langItem,
            caliber: item._props.Caliber,
            armorDamage: item._props.ArmorDamage,
            penetration: item._props.PenetrationPower,
            damage: item._props.Damage,
            rating: rating
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