
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');

/* GET home page. */
router.get('/', function(req, res, next) {

  console.log(process.env);

  const serverMode = process.env && process.env.ServerMode ? process.env.ServerMode : "Dev";

  res.render('index', { title: 'Paulov-t Tarkov Web Server', serverMode: serverMode });
});

module.exports = router;
