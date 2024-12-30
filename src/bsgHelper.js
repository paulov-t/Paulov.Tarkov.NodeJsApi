var zlib = require('zlib');
var Http = require('http');
const { logger } = require('./classes/logger');

/**
 * 
 * @param {import("express").Response} response 
 * @param {object} data 
 */
function addBSGBodyInResponseWithData(response, data) {
  response.body = { errmsg: null, err: 0, data: data };
}

function getBody(response, data) {
  response.body = 
    JSON.stringify({ errmsg: null, err: 0, data: data }, undefined, "\t")
    .replace(/[\b]/g, "")
    .replace(/[\f]/g, "")
    .replace(/[\n]/g, "")
    .replace(/[\r]/g, "")
    .replace(/[\t]/g, "");
}

function nullResponse(response) {
  addBSGBodyInResponseWithData(response, null);
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

    const stringifiedBody =
      typeof(req.body) === "object" ? JSON.stringify(req.body) : null;
  
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
        req.body = asyncInflatedString;
        done(req.body);

    }
    else  {
      if(typeof(req.body) !== "object")
        req.body = JSON.parse(req.body.toString('utf-8'));
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
  // This will handle if the previous steps have not stringify the data before
  if (typeof(data === 'object') && data.length === undefined) {
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
 * @param {function} done returns function with request body object parameter
 */
function extractSessionId(req, res, next, done) {

    const PHPSESSID = req.cookies != undefined && req.cookies["PHPSESSID"] !== undefined ? req.cookies["PHPSESSID"] : undefined;
    
    // Add the SessionId to the Request object
    if(PHPSESSID !== undefined)
        req.SessionId = PHPSESSID;
    
    done(req.body);
}

global.mongoIdCounter = 0;

function toHexString(byteArray) {
  let hexString = "";
  for (let i = 0; i < byteArray.length; i++) {
      hexString += `0${(byteArray[i] & 0xff).toString(16)}`.slice(-2);
  }
  return hexString;
}

function generateMongoId() {
    const time = Math.floor(new Date().getTime() / 1000);
    const counter = (global.mongoIdCounter + 1) % 0xffffff;
    const objectIdBinary = Buffer.alloc(12);

    objectIdBinary[3] = time & 0xff;
    objectIdBinary[2] = (time >> 8) & 0xff;
    objectIdBinary[1] = (time >> 16) & 0xff;
    objectIdBinary[0] = (time >> 24) & 0xff;
    objectIdBinary[4] = 0;
    objectIdBinary[5] = 0;
    objectIdBinary[6] = 0;
    objectIdBinary[7] = 0;
    objectIdBinary[8] = 0;
    objectIdBinary[9] = (counter >> 16) & 0xff;
    objectIdBinary[10] = (counter >> 8) & 0xff;
    objectIdBinary[11] = counter & 0xff;

    return toHexString(objectIdBinary);
}

exports.addBSGBodyInResponseWithData = addBSGBodyInResponseWithData;
exports.getBody = getBody;
exports.inflateRequest = inflateRequest;
exports.deflateRequest = deflateResponse;
exports.extractSessionId = extractSessionId;
exports.generateMongoId = generateMongoId;
exports.nullResponse = nullResponse;
exports.getUnclearedBody = getUnclearedBody;