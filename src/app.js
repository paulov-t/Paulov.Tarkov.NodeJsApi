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
const LoggingService = require('./services/LoggingService');
const { AccountService } = require('./services/AccountService');


// Import the `useAzureMonitor()` function from the `@azure/monitor-opentelemetry` package.
const { useAzureMonitor, AzureMonitorOpenTelemetryOptions } = require("@azure/monitor-opentelemetry");
const opentelemetryapi = require("@opentelemetry/api");
const { EnvironmentVariableService } = require('./services/EnvironmentVariableService');
let usingAppInsights = false;

try {
  // Check if the Application Insights connection string is set in the environment variables
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      console.log("Initializing Azure Application Insights...");

      const appInsights = require("applicationinsights");

// Use the instrumentation key or connection string from Application Insights
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setSendLiveMetrics(true)
  .start();

console.log("Application Insights initialized");



    // const { Resource } = require('@opentelemetry/resources');
    // const { SEMATTRS_ENDUSER_ID, SEMATTRS_HTTP_CLIENT_IP, SEMRESATTRS_SERVICE_INSTANCE_ID, SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_NAMESPACE, SemanticAttributes, SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
    // const customResource =  Resource.EMPTY;
    // // ----------------------------------------
    // // Setting role name and role instance
    // // ----------------------------------------
    // customResource.attributes[SEMRESATTRS_SERVICE_NAME] = "my-helloworld-service";
    // customResource.attributes[SEMRESATTRS_SERVICE_NAMESPACE] = "my-namespace";
    // customResource.attributes[SEMRESATTRS_SERVICE_INSTANCE_ID] = "my-instance";
    // if (process.env.OPEN_TELEMETRY_INSTANCE_NAME)
    //   customResource.attributes[SEMRESATTRS_SERVICE_INSTANCE_ID] = process.env.OPEN_TELEMETRY_INSTANCE_NAME;

    
    //   // Create a new AzureMonitorOpenTelemetryOptions object.
    //   /**
    //    * @type {AzureMonitorOpenTelemetryOptions}
    //    */
    //   const options = {
    //     azureMonitorExporterOptions: {
    //       connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    //     }
    //     , resource: customResource // Set the custom resource
    //     , samplingRatio: 1 // Set the sampling ratio to 1 (100%)
    //     , liveMetrics: true // Enable live metrics
    //     , instrumentationOptions: {
    //       azureSdk: { enabled: false },   // Disable Azure SDK instrumentation
    //       http: { enabled: false },      // Disable HTTP instrumentation
    //     }
    //   };
    //   // Call the `useAzureMonitor()` function to configure OpenTelemetry to use Azure Monitor.
    //   useAzureMonitor(options);
      usingAppInsights = true;
      console.log("Azure Application Insights initialized successfully.");

  } else {
      console.warn("APPLICATIONINSIGHTS_CONNECTION_STRING is not set. Skipping Application Insights initialization.");
  }
}
catch {

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

      if (usingAppInsights) {
     
        const currentSpan = opentelemetryapi.trace.getSpan(opentelemetryapi.context.active());
        if (currentSpan) {
          // display traceid in the terminal
          console.log(`traceid: ${currentSpan.spanContext().traceId}`);
        }
        
        const span = opentelemetryapi.trace.getTracer("apitrack").startSpan(
          `${req.method} ${req.url}`,
            {
              kind: opentelemetryapi.SpanKind.SERVER, // server
              attributes: { Duration: duration, responseCode: res.statusCode },
            });

        // Annotate our span to capture metadata about the operation
        span.addEvent(`trackRequest`
          , {
            statusCode: res.statusCode,
            message: res.statusMessage,
            duration: duration,
            method: req.method,
            url: req.url,
            sessionId: req.SessionId,
            responseCode: res.statusCode
          }
          , start);
        span.end(Date.now());
        console.log(`Tracked request: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      }
  });

  next();
});

app.use(function(req, res, next) {

  if(req.url.includes("files/")) {
    let filePath = req.url.replace(req.hostname, "");
    filePath = filePath.substring(1, filePath.length);
    filePath = path.join(__dirname, 'public', filePath);

    if(filePath.endsWith(".png")) {
      res.setHeader("content-type", "image/png");
    }

    const envVars = EnvironmentVariableService.getEnvironmentVariables();
    if (envVars.SHOW_HALLOWEEN_TRADERS && filePath.includes('avatar')) {
      filePath = filePath.replace('avatar', 'halloween');
    } 

    if(fs.existsSync(filePath)) {
      res.end(fs.readFileSync(filePath));
    }
    else if(fs.existsSync(filePath.replace(".jpg", ".png"))) {
      res.end(fs.readFileSync(filePath.replace(".jpg", ".png")));
    }
    else {
      LoggingService.logError(`${filePath} doesn't exist`);
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
app.use('/client', require('./routes/client/client'));
app.use('/client/friend', require('./controllers/friendController'));
app.use('/client/game/profile', require('./controllers/gameProfileController'));
app.use('/client/game/profile/items', require('./controllers/itemsMovingController'));
app.use('/client/hideout', require('./controllers/hideoutController'));
app.use('/client/locations', require('./controllers/locationsController'));
app.use('/client/mail', require('./controllers/mailController'));
app.use('/client/match', require('./controllers/matchController'));
app.use('/client/menu', require('./routes/client/menu/locale'));
app.use('/client/trading/api', require('./routes/client/trading'));
app.use('/client/ragfair', require('./controllers/ragfairController'));
app.use('/client/quest', require('./controllers/questController'));
app.use('/client/server', require('./controllers/serverController'));
app.use('/client/survey', require('./controllers/surveyController'));

app.use('/launcher', require('./controllers/launcherController'));

/** Paulov API v1 */
app.use('/v1/auth', require('./routes/v1/auth'));
app.use('/v1/user', require('./routes/v1/user'));
app.use('/v1/logging', require('./routes/v1/logging'));

/** User Views */
app.use('/user', require('./controllers/userController'));

/** Item Search Api */
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

    LoggingService.logError("Unhandled Request/Response");
    if(typeof(res.body) === 'object')
      res.end(Buffer.from(JSON.stringify(res.body)));
  }
});

// error handler
app.use(function(err, req, res, next) {


  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  LoggingService.logError(res.locals.error);

  const start = Date.now();

  res.on('finish', () => {
      const duration = Date.now() - start;

      if (usingAppInsights) {

        const currentSpan = opentelemetryapi.trace.getSpan(opentelemetryapi.context.active());
        if (currentSpan) {
          // display traceid in the terminal
          console.log(`traceid: ${currentSpan.spanContext().traceId}`);
        }
        
        const span = opentelemetryapi.trace.getTracer("apitrack").startSpan(`${req.method} ${req.url}`, {
          kind: opentelemetryapi.SpanKind.SERVER, // server
          attributes: { key: "value", duration: duration },
        });

        // Annotate our span to capture metadata about the operation
        span.addEvent(`trackFailedRequest`
          , {
            statusCode: err.status || 500,
            message: err.message,
          }
          , start
        );
        span.end();
      }
      
  });

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


AccountService.fixAccountsAfterUpdate();

module.exports = app;
