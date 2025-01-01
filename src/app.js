/**
 * This is where most of the routing and magic happens
 * This contains:
 * Express Routing
 * Express View Handling
 * Swagger UI generation
 * SessionId extraction
 * Zlib Inflate and Deflate and web requests and responses
 * Handling of loose files
 */

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { specs, swaggerUi } = require('./swagger');
var zlib = require('zlib');
var fs = require('fs');
var bsgHelper =  require('./bsgHelper');
const database = require('./classes/database');
const ownLogger = require('./classes/logger');

const zlibInflate = zlib.inflate;
const zlibDeflate = zlib.deflate;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var launcherRouter = require('./routes/launcher');
var pingRouter = require('./routes/ping');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.raw({ type: "application/json", limit: '50mb',
  parameterLimit: 100000,
  extended: true  }));

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/** Middleware: Detects and logs Uri calls */
app.use(function(req, res, next) {
  ownLogger.logger.logInfo(`${req.headers["host"] + req.url}`);
  next();
});

app.use(function(req, res, next) {

  if(req.url.includes("files/")) {
    let filePath = req.url.replace(req.host, "");
    filePath = filePath.substring(1, filePath.length);
    filePath = path.join(__dirname, 'public', filePath);

    if(filePath.endsWith(".png")) {
      res.setHeader("content-type", "image/png");
    }

    // console.log(`requested file: ${filePath}`);
    if(fs.existsSync(filePath)) {
      res.end(fs.readFileSync(filePath));
    }
    else {
      ownLogger.logger.logError(`${filePath} doesn't exist`);
      res.end(fs.readFileSync(path.join(__dirname, 'public', 'files', 'achievement', 'Standard_35.png')));
    }

  }
  else
    next();
});

/** Middleware: Extracts the SessionId into the Request object
 *  so that future middleware can use Request.SessionId */
app.use(function(req, res, next) {
  bsgHelper.extractSessionId(req, res, next, () => {
    next();
  });
});

/** Middleware: If required, inflates the Request Body using Zlib */
app.use(function(req, res, next) {
  bsgHelper.inflateRequest(req, res, next, () => {
    next();
  });
});

/** Middleware: Allows the Api to be browsable via Swagger UI */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/** All routers below. Generate response.body here... */
app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/launcher', launcherRouter);
app.use('/client', require('./routes/client/client'));
app.use('/client/menu', require('./routes/client/menu/locale'));
app.use('/client/trading/api', require('./routes/client/trading'));
app.use('/client/game/profile/items', require('./routes/client/game/profile/items'));
app.use('/itemSearch', require('./routes/itemSearch'));

/** Middleware: Deflates the Response Body using Zlib to a standard BSG expects */
app.use(function(req, res, next) {
  if(!bsgHelper.deflateRequest(req, res))
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if(res.body === undefined)
    next(createError(404));
  else {

    ownLogger.logger.logError("Unhandled Request/Response");
    if(typeof(res.body) === 'object')
      res.end(Buffer.from(JSON.stringify(res.body)));
  }
});

// error handler
app.use(function(err, req, res, next) {


  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  ownLogger.logger.logError(res.locals.error);

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

database.loadCompressedDatabase();

module.exports = app;
