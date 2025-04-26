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
const { specs, swaggerUi } = require('./swagger');
var zlib = require('zlib');
var fs = require('fs');
var bsgHelper =  require('./bsgHelper');
const database = require('./classes/database');
const ownLogger = require('./classes/logger');
const { AccountService } = require('./services/AccountService');

let appInsights = require('applicationinsights');

// Check if the Application Insights connection string is set in the environment variables
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    console.log("Initializing Azure Application Insights...");

    try {
      // Set up Application Insights
      appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(false, false)
        .setAutoCollectPreAggregatedMetrics(true)
        .setSendLiveMetrics(false)
        .setInternalLogging(false, true)
        .enableWebInstrumentation(false)
          // .setAutoCollectRequests(false) // Automatically track HTTP requests
          // .setAutoCollectPerformance(false) // Automatically track performance metrics
          // .setAutoCollectExceptions(false) // Automatically track exceptions
          // .setAutoCollectDependencies(false) // Automatically track dependencies
          // .setAutoCollectConsole(false, false) // Automatically track console logs
          // .setAutoCollectHeartbeat(true) // Automatically track heartbeats
          // .setAutoCollectPreAggregatedMetrics(true) // Automatically track pre-aggregated metrics 
          // .setInternalLogging(false) // Disable internal logging
          // .setSendLiveMetrics(false) // Disable live metrics
          // .setUseDiskRetryCaching(false) // Disable disk retry caching
          // .setAutoDependencyCorrelation(false) // Disable automatic dependency correlation
          // .enableWebInstrumentation(false) // Disable web instrumentation
          .start();
      console.log("Started Azure Application Insights.");

    }
    catch (error) {
      console.error("Error initializing Application Insights:", error);
      appInsights = undefined;
    }

} else {
    // If the connection string is not set, skip Application Insights initialization
    // and log a warning message
    appInsights = undefined;
    console.warn("APPLICATIONINSIGHTS_CONNECTION_STRING is not set. Skipping Application Insights initialization.");
}

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.raw({ type: "application/json", limit: '50mb',
  parameterLimit: 100000,
  extended: true  }));

  app.use(express.raw({ type: "image/png", limit: '50mb'}));

// Necessary for reading SessionId
app.use(cookieParser());

app.use(function(req, res, next) {
  database.Database.loadCompressedDatabase();
  next();
});


/** Middleware: Extracts the SessionId into the Request object
 *  so that future middleware can use Request.SessionId */
app.use(function(req, res, next) {
  bsgHelper.extractSessionId(req, res, next);
});

// Middleware to track Express page loads
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
      const duration = Date.now() - start;

      if (appInsights && appInsights.defaultClient) {
        // Track the request with Application Insights)
        const appInsightsClient = appInsights.defaultClient;
        appInsightsClient.trackRequest({
            name: `${req.method} ${req.url}`,
            url: req.url,
            duration: duration,
            resultCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 400,
            properties: {
                method: req.method,
                route: req.route ? req.route.path : req.url,
            },
        });

        console.log(`Tracked request: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      }
  });

  next();
});

/** Middleware: Detects and store Uri calls for metrics */
// app.use(function(req, res, next) {

//   // let responseText = (req.SessionId ? `[${req.SessionId}]:` : "") + `${req.headers["host"] + req.url}`;
//   let responseText = (req.SessionId ? `[${req.SessionId}]:` : "") + `${req.url}`;
//   ownLogger.logger.logInfo(responseText);
//   next();
// });


app.use(function(req, res, next) {

  if(req.url.includes("files/")) {
    let filePath = req.url.replace(req.host, "");
    filePath = filePath.substring(1, filePath.length);
    filePath = path.join(__dirname, 'public', filePath);

    if(filePath.endsWith(".png")) {
      res.setHeader("content-type", "image/png");
    }

    if(fs.existsSync(filePath)) {
      res.end(fs.readFileSync(filePath));
    }
    else if(fs.existsSync(filePath.replace(".jpg", ".png"))) {
      res.end(fs.readFileSync(filePath.replace(".jpg", ".png")));
    }
    else {
      ownLogger.logger.logError(`${filePath} doesn't exist`);
      res.end(fs.readFileSync(path.join(__dirname, 'public', 'files', 'achievement', 'Standard_35.png')));
    }

  }
  else
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

/** Middleware: If required, inflates the Request Body using Zlib */
app.use(function(req, res, next) {
  bsgHelper.inflateRequest(req, res, next, () => {
    next();
  });
});

/** Middleware: Allows the Api to be browsable via Swagger UI */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/** All routers below. Generate response.body here... */
app.use('/', require('./routes/index'));
// app.use('/users', usersRouter);
app.use('/launcher', require('./controllers/launcherController'));
app.use('/client', require('./routes/client/client'));
app.use('/client/menu', require('./routes/client/menu/locale'));
app.use('/client/trading/api', require('./routes/client/trading'));
app.use('/client/game/profile/items', require('./controllers/itemsMovingController'));
app.use('/client/friend', require('./controllers/friendController'));
app.use('/client/ragfair', require('./routes/client/ragfair'));
app.use('/client/mail', require('./controllers/mailController'));
app.use('/client/match', require('./controllers/matchController'));
app.use('/client/game/profile', require('./controllers/gameProfileController'));

app.use('/itemSearch', require('./routes/itemSearch'));

/** Paulov API v1 */
app.use('/v1/auth', require('./routes/v1/auth'));
app.use('/v1/user', require('./routes/v1/user'));
app.use('/v1/logging', require('./routes/v1/logging'));

/** User Views */
app.use('/user', require('./controllers/userController'));


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

  const start = Date.now();

  res.on('finish', () => {
      const duration = Date.now() - start;

      if (appInsights) {
        const appInsightsClient = appInsights.defaultClient;
        if (appInsightsClient) { 
          // Track the exception with Application Insights 
          appInsightsClient.trackException({
            exception: err,
            properties: {
              method: req.method,
              route: req.route ? req.route.path : req.url,
              statusCode: res.statusCode,
              duration: duration,
            },
            measurements: {
              duration: duration,
            },
          });
        }

        console.error(`Tracked Exception: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      }
  });

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


AccountService.fixAccountsAfterUpdate();

module.exports = app;
