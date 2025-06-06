var zlib = require('zlib');
var Http = require('http');
var { mongoid } = require('mongoid-js');

/**
 * 
 * @param {import("express").Response} response 
 * @param {object} data 
 */
function addBSGBodyInResponseWithData(response, data) {
  if (!response)
    throw "response not provided!";

  if (data === undefined)
    throw "data not provided!";

  response.body = { errmsg: null, err: 0, data: data };
}

function getBody(response, data) {
  if (!response)
    throw "response not provided!";

  if (data === undefined)
    throw "data not provided!";

  response.body = 
    JSON.stringify({ errmsg: undefined, err: 0, data: data }, undefined, "\t")
    .replace(/[\b]/g, "")
    .replace(/[\f]/g, "")
    .replace(/[\n]/g, "")
    .replace(/[\r]/g, "")
    .replace(/[\t]/g, "");
}

function nullResponse(response) {
  response.body = { errmsg: null, err: 0, data: null };
}

function errorResponse(response, err, errmsg) {
  response.body = JSON.stringify({ errmsg: errmsg, err: err, data: null });
}

function getUnclearedBody(response, data) {
  response.body = JSON.stringify({ errmsg: null, err: 0, data: data });
}

/**
 * Inflates the request object using Zlib but only when detected
 * @param {Http.IncomingMessage} req request object
 * @param {Http.OutgoingMessage} res response object
 * @param {function} next if you want to skip to next middleware
 * @param {function} done returns function with request body object parameter
 */
function inflateRequest(req, res, next, done) {

  const bodyType = typeof(req.body);

    let stringifiedBody = '{}';

    // If Buffer then convert
    if (bodyType === "object" && req.body.byteLength !== undefined)
      stringifiedBody = req.body.toString('utf-8');

    if(stringifiedBody == '{}') {
      done(req.body);
      return;
    }
  
      let isJson = req.body.toString !== undefined 
        && req.body.toString('utf-8').charAt(0) == "{";
   
    if(
      (!isJson || (req.headers["content-encoding"] !== undefined && req.headers["content-encoding"] == "deflate"))
      &&
      ((req.headers["user-agent"] !== undefined && req.headers["user-agent"].includes("Unity"))
      && req.body["toJSON"] !== undefined)
      ) {
      
        const asyncInflatedString = zlib.inflateSync(req.body).toString('utf-8');
        if (asyncInflatedString.startsWith("{") || asyncInflatedString.startsWith("["))
          req.body = JSON.parse(asyncInflatedString);
        else
          req.body = asyncInflatedString;
        done(req.body);

    }
    else  {
      req.body = JSON.parse(stringifiedBody);
      done(req.body);
    }
}

/**
 * Deflates the response body using Zlib but only when detected
 * @param {Http.IncomingMessage} req request object
 * @param {Http.OutgoingMessage} res response object
 * @param {function} next if you want to skip to next middleware
 * @param {function} done returns function with request body object parameter
 */
function deflateResponse(req, res) {

  if(res.body === undefined || res.body === null)
  {
    return false;
  }

  let data = res.body;
  const typeOfData = typeof(data);
  // This will handle if the previous steps have not stringify the data before
  if ((typeOfData ===  'object' || typeOfData === 'array') && (data.length === undefined || JSON.stringify(data).charAt(0) === '[')) {
    const stringified = JSON.stringify(data, null, "\t") 
                        .replace(/[\b]/g, "")
                        .replace(/[\f]/g, "")
                        .replace(/[\n]/g, "")
                        .replace(/[\r]/g, "")
                        .replace(/[\t]/g, "");
    data = Buffer.from(stringified);
  }
  else
    data = Buffer.from(data);

  const deflateData = zlib.deflateSync(data);

  // HACK
  // BSG apparently do not understand headers and content-encoding 
  // so we can only add this as a workaround when using literally anything else!
  if(req.headers["postman-token"] !== undefined)
      res.setHeader("content-encoding", "deflate");

  if(req.headers["user-agent"] !== undefined && !(req.headers["user-agent"].startsWith("Unity")))
      res.setHeader("content-encoding", "deflate");

  res.setHeader("content-type", "application/json");

  res.body = null;
  res.send(deflateData);
     
  return true;
}

/**
 * Finds and extracts the SessionId from the Cookies and adds a new Member to the Request called SessionId
 * @param {Http.IncomingMessage} req request object
 * @param {Http.OutgoingMessage} res response object
 * @param {function} next if you want to skip to next middleware
 */
function extractSessionId(req, res, next) {

    const PHPSESSID = req.cookies != undefined && req.cookies["PHPSESSID"] !== undefined ? req.cookies["PHPSESSID"] : undefined;
    
    // Add the SessionId to the Request object
    if(PHPSESSID !== undefined)
        req.SessionId = PHPSESSID;
    
    next();
}

global.mongoIdCounter = 0;

function toHexString(byteArray) {
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
      hexString += `0${(byteArray[i] & 0xff).toString(16)}`.slice(-2);
  }
  return hexString;
}

/**
 * Gets a generated Mongo Id
 * @returns {String} Generated MongoId
 */
function generateMongoId() {
    const result = mongoid();
    return result;
}

/**
 * 
 * @param {Number} timestamp 
 * @returns {Date}
 */
function getInRaidTime(timestamp) {
  // tarkov time = (real time * 7 % 24 hr) + 3 hour
  const russiaOffsetMilliseconds = (3 * 60 * 60) * 1000;
  const twentyFourHoursMilliseconds = (24 * 60 * 60) * 1000;
  const currentTimestampMilliSeconds = timestamp ? timestamp : new Date().getTime();

  return new Date(
      (russiaOffsetMilliseconds + currentTimestampMilliSeconds * 1) %
          twentyFourHoursMilliseconds,
  );
}

exports.addBSGBodyInResponseWithData = addBSGBodyInResponseWithData;
exports.getBody = getBody;
exports.inflateRequest = inflateRequest;
exports.deflateRequest = deflateResponse;
exports.extractSessionId = extractSessionId;
exports.generateMongoId = generateMongoId;
exports.errorResponse = errorResponse;
exports.nullResponse = nullResponse;
exports.getUnclearedBody = getUnclearedBody;
exports.getInRaidTime = getInRaidTime;