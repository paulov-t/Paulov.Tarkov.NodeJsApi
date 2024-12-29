var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { specs, swaggerUi } = require('./swagger');
var zlib = require('zlib');
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
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'files')));
app.use(express.static(path.join(__dirname, 'res')));

/** Middleware: Detects and logs Uri calls */
app.use(function(req, res, next) {
  ownLogger.logger.logInfo(`${req.headers["host"] + req.url}`);
  next();
});

/** Middleware: Extracts the SessionId into the Request object
 *  so that future middleware can use Request.SessionId */
// app.use(function(req, res, next) {
//   bsgHelper.extractSessionId(req, res, next, () => {
//     next();
//   });
// });

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
// app.use('/client', require('./routes/client/client'));
app.use('/client/menu', require('./routes/client/menu/locale'));

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

  ownLogger.logger.logError("");

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

database.loadCompressedDatabase();

module.exports = app;
