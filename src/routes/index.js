
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Paulov TWS' });
});

module.exports = router;
