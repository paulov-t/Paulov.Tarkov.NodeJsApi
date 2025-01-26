
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
var packageJson =  require('./../package.json');

/* GET home page. */
router.get('/', function(req, res, next) {

  console.log(process.env);

  const serverMode = process.env && process.env.ServerMode ? process.env.ServerMode : "Dev";

  const appVersion = packageJson.version;

  res.render('index', { title: 'Paulov-t Tarkov Web Server', serverMode: serverMode, appVersion: appVersion });
});

/* GET Item Search page. */
router.get('/itemSearch', function(req, res, next) {

  res.render('itemSearch', { title: 'Paulov-t Tarkov Web Server' });
});

/* GET Item Search page. */
router.get('/ammo', function(req, res, next) {

  res.render('ammo', { title: 'Paulov-t Tarkov Web Server' });
});

router.get('/items', function(req, res, next) {

  res.render('itemSearch', { title: 'Paulov-t Tarkov Web Server' });
});

router.get('/login', function(req, res, next) {

  res.render('login', { title: 'Paulov-t Tarkov Web Server' });
});

module.exports = router;
