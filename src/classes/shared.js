var packageJson =  require('./../package.json');

function getRenderViewModel(req) {

    const serverMode = process.env && process.env.ServerMode ? process.env.ServerMode : "Dev";
    const appVersion = packageJson.version;
    return { 
      title: 'Paulov-t Tarkov Web Server'
      , serverMode: serverMode
      , appVersion: appVersion
      , loggedIn: req.SessionId !== undefined 
      , loggedInUN: undefined
    };
}

function getRenderViewModelWithUsername(req, username) {
  const rvm = getRenderViewModel(req);
  rvm.loggedInUN = username;
  return rvm;
}

module.exports.getRenderViewModel = getRenderViewModel;
module.exports.getRenderViewModelWithUsername = getRenderViewModelWithUsername;