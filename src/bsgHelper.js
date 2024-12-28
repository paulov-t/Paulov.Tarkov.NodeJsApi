var zlib = require('zlib');

/**
 * 
 * @param {import("express").Response} response 
 * @param {any} data 
 */
function addBSGBodyInResponseWithData(response, data) {
    response.body = { errMsg: null, err: 0, body: data };
    // response.json({ errMsg: null, err: 0, body: data })
}

function getBody(response, data) {
    addBSGBodyInResponseWithData(response, data);
}

/**
 * Inflates the request object using Zlib but only when detected
 * @param {Http.IncomingMessage} req request object
 * @param {object} res response object
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
      
      try {
        zlib.inflate(req.body, function(err, result) { 
  
          if(!err && result !== undefined) {
  
            var asyncInflatedString = result.toString('utf-8');
            if(asyncInflatedString.length > 0) {
              req.body = JSON.parse(asyncInflatedString);
            }
            done(req.body);
            return;
  
          }
          else {
            done(req.body);
            return;
  
          }
  
  
        });
  
      }
      catch (error) { 
        // console.error(error);
        req.body = JSON.parse(req.body);
        done(req.body);
        return;
  
      }
      // console.log("inflating data...");
      // console.log(req.body);
  
    }
    else  {
      if(typeof(req.body) !== "object")
        req.body = JSON.parse(req.body.toString('utf-8'));
      done(req.body);
    }
}

function deflateRequest(req, res, next, done) {

    let data = res.body;
    if (typeof(data === 'object'))
        data = Buffer.from(JSON.stringify(data));

    zlib.deflate(data, (err, deflateData) => {
        // HACK
        // BSG apparently do not understand headers and content-encoding 
        // so we can only add this as a workaround when using literally anything else!
        if(req.headers["postman-token"] !== undefined)
            res.setHeader("content-encoding", "deflate");

        if(req.headers["user-agent"] !== undefined 
            && (req.headers["user-agent"].startsWith("Mozilla")))
            res.setHeader("content-encoding", "deflate");

        res.setHeader("content-type", "application/json");

        res.send(deflateData);

    });
}

/**
 * Finds and extracts the SessionId from the Cookies and adds a new Member to the Request called SessionId
 * @param {Http.IncomingMessage} req request object
 * @param {object} res response object
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

exports.addBSGBodyInResponseWithData = addBSGBodyInResponseWithData;
exports.getBody = getBody;
exports.inflateRequest = inflateRequest;
exports.deflateRequest = deflateRequest;
exports.extractSessionId = extractSessionId;