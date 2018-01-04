'use strict';

import fs from 'fs';
import path from 'path';

// import captureLogs from './utils/captureLogs.js';
// captureLogs();

import requestLogger from './utils/requestLogger.js';


import Hapi from 'hapi';
import inert from 'inert';
import good from 'good';
import hapijsStatusMonitor from 'hapijs-status-monitor';
import cookieAuth from 'hapi-auth-cookie';
import apmRequireHttps from './plugins/requireHttps/index.js';
import jwtDecode from 'jwt-decode';
import async from 'async/lib/async.js';
import HTML from './view/HTML.js';

import { addInternalRoutes } from './internal/internalRoutes';

import { signin, signup, signupConfirm, signout, forgotPassword, changePassword, createUserConfirm,
  resetPassword, validateCookieAuth, validateAuthRedirect, getUserPermissions,
  getStaticResourcePermissions, terms } from './auth/handlers.js';
import records from './sor/records.js';
import sh from './surveyHosting/surveyHostingHandlers.js';
import { schemas, initAll } from './schema/schemas.js';
import initializeSchemas from './schema/utils/initializeSchemas';

import { getRequestFullURL, getAccessToken } from './utils/httpUtil.js';

//import * as nodekey from '../../certs/nodekey.pem';
//import * as nodecert from '../../certs/nodecert.pem';

import { getTenantHost } from '../client/common/utils/hostnameUtils.js';

import {
  getPagedSurveys,
  newSurvey,
  updateSurveyDesign,
  getSurveyParticipants,
  updateSurveyParticipants,
  runSurveyAction,
  updateEstimate,
  updateSurvey,
  getPagedTemplates,
  createOrUpdateTemplate,
  getSurveys,
  getTemplates,
  getSurveyDesign,
  getSurveyResponses,
  getSurveyTimeline,
  getSurveyDetails,
  updateSurveyDetails,
  createSurvey,
  deleteSurvey,
  getSurveyComments,
  createSurveyComments,
  updateSurveyComment,
  deleteSurveyComments,
  getSurveyAttachments,
  uploadSurveyAttachment,
  downloadSurveyAttachment,
  deleteSurveyAttachment,
  createSurveyPanel,
  getSurveyPanel,
  getSurveyPanelInfo,
  getSurveyAnalysis,
  getSurveyQuestionAnalysis,
  getSurveyExport,
} from './surveys/index.js';

import {
  createCustomField,
  deleteCustomField,
  getPagedUsers,
  saveUser,
  deleteUser,
  deleteAvatar,
  uploadProfile,
  uploadAvatar,
} from './profile/index.js';

import {
  getPagedPanels, getPanelPeople, writePanel, uploadPanel, deletePanel
} from './panels/panelHandlers.js';

import {
  getImportLog, dataImport, downloadImportFileHandler,
} from './admin/index.js';

import {
  getEnums,
} from './enums/index.js';

import applySourceMapFilter from './utils/sourceMapFilter';

// import {
//   getSurveySummary
// } from './surveys/SurveyMethods.js';

/**
 * Print out environment configuration
 *
 * FIXME: DELAY by 10 seconds to log after pm2 logs is hook
 */
import { logEnv } from './utils/envUtil';
setTimeout(() => {
  logEnv();
}, 10000);


/* Server base-config:
 *
 * It's worth noting that the routes are relative to the
 * location and arrangement of the final bundle (dist/client).
 * If this ever becomes problematic, creating some webpack-
 * loaders to handle the issue might be in order.
 */

const server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: path.join(__dirname, '../client'),
      },
      cors: false,
    },
  },
});

/**
 * hapijs monitor status only support one connection, there is branch that supports multiple connections as well
 * but really we just need one port all the time, if we test https, just enable https, otherwise http!
 */
if(process.env.NODE_HTTPS === true || process.env.NODE_HTTPS === 'true') {
  // https connection
  server.connection({
    port: process.env.NODE_PORT || 3434,
    tls: {
      key: fs.readFileSync('../../certs/nodekey.pem'),
      cert:fs.readFileSync('../../certs/nodecert.pem'),
    },
    routes: { cors: false },
  });
} else {
  // http connection
  server.connection({ port: process.env.NODE_PORT || 3333, routes: { cors: false } });
}

// Log handling plugin (does not yet support config).
server.register(requestLogger);

/**
 * Monitors server status & the route '/status'
 * TODO: use this or other like good monitoring
 */
if(process.env.NODE_ENV === 'development')
  server.register({ register: hapijsStatusMonitor });

// Static file serving:
server.register(inert);


// TODO: figure out why server crashes when registering survey host before auth
// Register Survey Hosting plugins.
server.register(sh('/sh'));

// Register cookie based auth layer
server.register(cookieAuth);

server.auth.strategy('apmSession', 'cookie', true, { // third parameter true will set this strategy to be default
  password: process.env.COOKIE_PASSWORD,  // 32 chars
  cookie: process.env.COOKIE_NAME,
  isHttpOnly: true,
  isSecure: false,
  domain: process.env.CLIENT_DOMAIN_NAME && `.${process.env.CLIENT_DOMAIN_NAME}`,
  path: '/',
  ttl: null,
  clearInvalid: true,
  validateFunc: validateCookieAuth,
});

// Register 'SOR' plugins.
server.register(records);

// forward http to https
server.register(apmRequireHttps);

function getStaticContent(req, res) {
  let filePath;
  if(req.url.path.indexOf('/favicon.ico') === 0)
    filePath = '../../dist/client/favicon.ico';// TODO: set to the favicon file path
  else
    filePath = req.params.path;

  return res.file(filePath, {
    confine: true,
    lookupCompressed: process.env.NODE_ENV === 'production',
    etagMethod: process.env.NODE_ENV === 'production' ? 'hash' : false,
  });
}

function getPage(req, res) {
  const url = getRequestFullURL(req);
  console.log(`getPage called, requesting url: ${url}, isTrue: ${req.auth.isAuthenticated}`);
  if((!req.auth.isAuthenticated &&
      req.url.path.length >= 1)  // could be '/'
    || req.url.path.indexOf('/sh') === 0) {
    const redirect = validateAuthRedirect(req);
    console.log('redirecting to ', redirect, req.url);
    return res.redirect(redirect);
  }

  /*
   * User is Authenticated, parse JWT token and patch the session initial
   * state with uid and tun.
   */
  const access = jwtDecode(getAccessToken(req));

  const host = req.headers.host;
  const tenantHost = getTenantHost(access.tun);
  console.log('host/tenantHost:', host, tenantHost);
  if(tenantHost && host !== tenantHost) {
    return res.redirect(
      `${process.env.CLIENT_HTTPS === 'true' || process.env.CLIENT_HTTPS === true ? 'https' : 'http'}://${tenantHost}${req.url.path}`
    );
  }

  async.waterfall([
    (callback) => {
      getUserPermissions(req, (err, resp) => {
        callback(err, { permissions: resp });
      });
    },
    (prev, callback) => {
      getStaticResourcePermissions(req, access.tun, (err, resp) => {
        callback(err, { ...prev, staticResourcePermissions: resp })
      });
    },
    (prev, callback) => {
      const { permissions: { roles } } = prev;
      initializeSchemas(req, roles, (err, resp) => {
        callback(err, { ...prev, schemas: resp });
      });
    }
  ], (err, results) => {
    if(!err) {
      let initialState = results.schemas;
      initialState = {
        ...initialState,
        session: {
          schema: initialState.session.schema,
          data: {
            authenticated: true,
            user: { id: access.uid, roles: results.permissions.roles },
            tenant: { uniqueName: access.tun },
            staticResourcePermissions: results.staticResourcePermissions && results.staticResourcePermissions.content,
          },
        },
      };
      return res(HTML(initialState, 'APM'));
      // return expandedSchemas('agilepm').then(s => res(HTML(s, 'APM')));
    }
    // there is error, return the results which contains the error wrapper
    return res(err);
  });
}

/* Need to register this route after session strategy is registered so that it can be enabled on try
 * otherwise there is no way to register at route that does not fail on authentication error.
 */
server.route({
  method: 'GET',
  path: '/{path*}',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'log', // may also be 'ignore' or 'log'
    },
    auth: {
      strategy: 'apmSession',
      mode: 'optional',
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: validateAuthRedirect,
      },
    },
    handler: getPage,
  },
});

server.route({
  method: 'GET',
  path: '/__static/{path*}',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'ignore', // may also be 'ignore' or 'error'
    },
    auth: false,
    handler: applySourceMapFilter(getStaticContent),
  },
});

server.route({
  method: 'GET',
  path: '/favicon.ico',   // this request is from browser
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'ignore', // may also be 'ignore' or 'log'
    },
    auth: false,
    handler: getStaticContent,
  },
});

addInternalRoutes(server);

server.route({
  method: 'GET',
  path: '/init',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'error', // may also be 'ignore' or 'log'
    },
    auth: false,
    handler: initAll,
  },
});

server.route({
  method: ['GET', 'POST'],
  path: '/signup',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'error', // may also be 'ignore' or 'log'
    },
    auth: false,
    handler: signup,
  },
});

server.route({
  method: 'GET',
  path: '/signupConfirm',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'error', // may also be 'ignore' or 'log'
    },
    auth: false,
    handler: signupConfirm,
  },
});

server.route({
  method: ['GET', 'POST'],
  path: '/signin',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'error', // may also be 'ignore' or 'log'
    },
    auth: false,
    handler: signin,
  },
});

server.route({
  method: 'POST',
  path: '/signout',
  config: {
    auth: false,
    handler: signout,
  },
});

server.route({
  method: ['GET', 'POST'],
  path: '/forgotPassword',
  config: {
    auth: false,
    handler: forgotPassword,
  },
});

server.route({
  method: ['GET', 'POST'],
  path: '/resetPassword',
  config: {
    auth: false,
    handler: resetPassword,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/{id}/changePassword',
  config: {
    handler: changePassword,
  },
});

server.route({
  method: 'GET',
  path: '/terms',
  config: {
    auth: false,
    handler: terms,
  },
});

// http://54.191.17.32:3333/xhr/surveyTemplates
server.route({
  method: 'GET',
  path: '/xhr/surveyTemplates',
  config: {
    handler: getPagedTemplates,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/analysis',
  config: {
    handler: getSurveyAnalysis,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/analysis/{questionId}',
  config: {
    handler: getSurveyQuestionAnalysis,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/surveys/{id}/responses/export',
  config: {
    handler: getSurveyExport,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/responses/{rid?}',
  config: {
    handler: getSurveyResponses,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/panels/{id?}',
  config: {
    handler: getPagedPanels,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/panels/{id?}',
  config: {
    handler: writePanel,
  },
});

server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/panels/{id}',
  config: {
    handler: deletePanel,
  },
});


server.route({
  method: 'POST',
  path: '/{tenant}/xhr/panels/{id}/upload',
  config: {
    payload: {
      parse: false,
    },
    handler: uploadPanel,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/{objectType}/upload',
  config: {
    payload: {
      parse: false,
    },
    handler: uploadProfile,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/import',
  config: {
    payload: {
      parse: false,
    },
    handler: dataImport,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/admin/dataImportLog',
  config: {
    handler: getImportLog,
  },
});

server.route({
  method: 'GET',
  path: '/download/import/{id}',
  config: {
    state: {
      parse: true, // parse and store in request.state
      failAction: 'log', // may also be 'ignore' or 'error'
    },
    handler: downloadImportFileHandler,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/panels/{id}/people',
  config: {
    handler: getPanelPeople,
  },
});


server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id?}',
  config: {
    handler: getPagedSurveys,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}',
  config: {
    handler: updateSurvey,
  },
});

server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/surveys/{id}',
  config: {
    handler: deleteSurvey,
  },
});


server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys',
  config: {
    handler: newSurvey,
  },
});


// DEPRICATED ========
server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/design',
  config: {
    handler: getSurveyDesign,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/design',
  config: {
    handler: updateSurveyDesign,
  },
});
// ====================

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/details',
  config: {
    handler: getSurveyDetails,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/details',
  config: {
    handler: updateSurveyDetails,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/timeline',
  config: {
    handler: getSurveyTimeline,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/participants',
  config: {
    handler: getSurveyParticipants,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/participants',
  config: {
    handler: updateSurveyParticipants,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/estimate',
  config: {
    handler: updateEstimate,
  },
});


server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/actions',
  config: {
    handler: runSurveyAction,
  },
});


server.route({
  method: 'GET',
  path: '/{tenant}/xhr/enums/{enumType}',
  config: {
    handler: getEnums,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveyTemplates',
  config: {
    handler: getPagedTemplates,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveyTemplates/{id?}',
  config: {
    handler: createOrUpdateTemplate,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/comments',
  config: {
    handler: getSurveyComments,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/comments',
  config: {
    handler: createSurveyComments,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/comments/{cid}',
  config: {
    handler: updateSurveyComment,
  },
});


server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/surveys/{id}/comments/{cid}',
  config: {
    handler: deleteSurveyComments,
  },
});


server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/attachments',
  config: {
    handler: getSurveyAttachments,
  },
});


server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/attachments',
  config: {
    payload: {
      parse: false,
    },
    handler: uploadSurveyAttachment,
  },
});


server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/attachments/{fid}/download',
  config: {
    handler: downloadSurveyAttachment,
  },
});


server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/surveys/{id}/attachments/{fid}',
  config: {
    handler: deleteSurveyAttachment,
  },
});


server.route({
  method: 'POST',
  path: '/{tenant}/xhr/surveys/{id}/panel',
  config: {
    handler: createSurveyPanel,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/panel',
  config: {
    handler: getSurveyPanel,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/surveys/{id}/panel/{type}',
  config: {
    handler: getSurveyPanelInfo,
  },
});

server.route({
  method: 'GET',
  path: '/{tenant}/xhr/users/{id?}',
  config: {
    handler: getPagedUsers,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/users/{id}/attachments',
  config: {
    payload: {
      parse: false,
    },
    handler: uploadAvatar,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/users/{id?}',
  config: {
    handler: saveUser,
  },
});

server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/users/{id?}',
  config: {
    handler: deleteUser,
  },
});

server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/users/{id}/thumbnail',
  config: {
    handler: deleteAvatar,
  },
});

/**
 * This needs a public access as the user created not login yet
 */
server.route({
  method: 'GET',
  path: '/createUserConfirm',
  config: {
    auth: false,
    handler: createUserConfirm,
  },
});

server.route({
  method: 'POST',
  path: '/{tenant}/xhr/admin/customFields/{id?}',
  config: {
    handler: createCustomField,
  },
});

server.route({
  method: 'DELETE',
  path: '/{tenant}/xhr/admin/customFields/{id}',
  config: {
    handler: deleteCustomField,
  },
});

server.start((err) => {
  if(err)
    throw err;
  console.log(`Server running at: ${server.info.uri}`);
});
