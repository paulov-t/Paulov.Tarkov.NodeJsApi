
var express = require('express');
var router = express.Router();
var bsgHelper =  require('./../bsgHelper');
const { getRenderViewModel } = require('../classes/shared');
const { AccountService } = require('../services/accountService');



/* GET home page. */
router.get('/', function(req, res, next) {

  // console.log(process.env);

  const vm = getRenderViewModel(req);
  if (vm.loggedIn)
    vm.loggedInUN = AccountService.getAccount(req.SessionId).username;

  vm.title = "Home";
  res.render('index', vm);
});

/* GET Item Search page. */
router.get('/itemSearch', function(req, res, next) {

  res.redirect('/items');
});

/* GET Item Search page. */
router.get('/ammo', function(req, res, next) {

  const vm = getRenderViewModel(req);
  vm.title = "Tarkov Ammo Table";
  res.render('ammo', vm);
});

router.get('/items', function(req, res, next) {

  const vm = getRenderViewModel(req);
  vm.title = "Tarkov Item Table";

  res.render('itemSearch', vm);
});

router.get('/traders', function(req, res, next) {

  const vm = getRenderViewModel(req);
  vm.title = "Tarkov Trader Table";

  res.render('traders', vm);
});


router.get('/live-players', function(req, res, next) {

  const vm = getRenderViewModel(req);
  vm.title = "Live Players Table";

  res.render('livePlayers', vm);
});

router.get('/login', function(req, res, next) {

  res.render('login', getRenderViewModel(req));
});

router.get('/logout', function(req, res, next) {

  res.clearCookie("PHPSESSID");

  res.redirect('./');
});

/* GET Item Search page. */
router.get('/logging', function(req, res, next) {

  const vm = getRenderViewModel(req);
  vm.title = "Logging";
  res.render('loggingHistory', vm);
});

module.exports = router;
