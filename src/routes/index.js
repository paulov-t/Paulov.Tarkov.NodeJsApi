
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');

/* GET home page. */
router.get('/', function(req, res, next) {

  console.log(process.env);

  const serverMode = process.env && process.env.ServerMode ? process.env.ServerMode : "Dev";

  res.render('index', { title: 'Paulov-t Tarkov Web Server', serverMode: serverMode });
});

/* GET home page. */
router.get('/itemSearch', function(req, res, next) {

  res.render('itemSearch', { title: 'Paulov-t Tarkov Web Server' });
});

module.exports = router;
