/**
 * handler for git commit information.
 */

let webAppBuildInfo;
let info = {};

try {
  webAppBuildInfo = require('../../../build-info.json');
  if (webAppBuildInfo && webAppBuildInfo['git-commit-id-abbrev']) {
    info['web-app'] = {
      'revision': webAppBuildInfo['git-commit-id-abbrev'],
    };
  }
} catch (error) {}

try {
  let agileUIBuildInfo = require('agile-ui/build-info.json');
  if (agileUIBuildInfo && agileUIBuildInfo['git-commit-id-abbrev']) {
    info['agile-ui'] = {
      'revision': agileUIBuildInfo["git-commit-id-abbrev"],
    };
  }
} catch (error) {}

function infoHandler(req, res) {
  res(info);
}

/**
 * Route configuration for info
**/
export default infoHandler;
