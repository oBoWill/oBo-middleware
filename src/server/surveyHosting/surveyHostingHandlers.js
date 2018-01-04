/**
 * Created by rj on 11/04/17.
 */

import axios from 'axios';

import Boom from 'boom';
import uuid from 'uuid';
import b64 from 'b64';
import crypto from 'crypto';

import moment from 'moment';

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import { validateReCaptcha, createHMAC, validateHMAC } from './reCaptchaValidation';
import surveyEngine from './surveyEngine.js';
import generateErrorPage from './surveyHostingError.js';
import turingTest from './turingTest.js';

// Max Session length = 2 hours
const MAX_SESSION_LENGTH = 2 * 60 * 60 * 1000;

// API endpoint base constructed from env variables
const {
  SERVICE_PROTOCOL,
  SH_SERVICE_BASE, SH_COOKIE_NAME,
  RECAPTCHA_VERIFICATION, RECAPTCHA_SITEKEY,
} = process.env;

const SH_SERVICE_BASE_URL = `${SH_SERVICE_BASE}/public/surveys/`;

const getSeed = () => crypto.randomBytes(8).toString('base64');

// Create api axios instance for the surveyHosting service.
export const surveyHostingService = axios.create({
  // URL endpoint default base.
  baseURL: SH_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

const COOKIE_SETTINGS = {
  ttl: MAX_SESSION_LENGTH,
  encoding: 'none',
  path: '/',
  isSecure: false,
  isHttpOnly: true
};

// Generate a cookie to uniquely identify respondents
export const generateCookie = (params) => {
  let { vid, pid, tid } = params;
  let uniqueId;
  if(vid && tid) {
    uniqueId = `${vid}${pid}${tid}`;
  } else {
    uniqueId = uuid.v4();
  }
  console.log('generated uniqueId', uniqueId, params, new Date());

  return ({
    ...params,
    uniqueId,
    timestamp: +new Date(),
    submitted: false,
    seed: getSeed(),
  });
}

// Base64 Encode the cookie
export const encodeCookie = (cookie) => {
  const json = JSON.stringify(cookie);
  const encoded = b64.encode(new Buffer(json)).toString();
  // console.log('encoding cookie:,', json, encoded);
  return encoded;
};

// Decode the Bas64 encoded cookie
export const decodeCookie = (cookieStr) => {
  console.log(cookieStr);
  const json = cookieStr && b64.decode(new Buffer(cookieStr)).toString();
  // console.log('decoding cookie:', json);
  if(!json || json.length == 0) return undefined;
  return JSON.parse(json);
};

// How many proxies forward the request
const proxyCount = 1;

// get the Client's IP even if they are behind an ELB reverse proxy
const getRemoteAddr = (req) => {
  const elbAddr = req.headers['x-forwarded-for'];
  return elbAddr ? elbAddr.split(',').slice(-proxyCount)[0] : req.info.remoteAddress;
};

// validate the HMAC and session length
const validateSession = (session, logErrors) => {
  if(!session) {
    console.log('No session to validate', new Date());
    return false;
  }
  const { timestamp, captcha, uniqueId, hmac } = session;
  if(timestamp < (+new Date() - MAX_SESSION_LENGTH)) return false;
  const validHmac = validateHMAC(timestamp, captcha, uniqueId, hmac);
  if(!validHmac && logErrors) {
    console.log('INVALID SURVEY HMAC:', session, new Date());
  }

  return validHmac;
};

export const errors = {
  notFound: () => ({
    errorTitle: 'Bad URL',
    errorMessage: 'This is not a valid survey.',
    errorResolution: 'Please contact the survey administrator to get the correct survey link.<br/><br/>AgilePM Team',
  }),
  notStarted: () => ({
    errorTitle: 'Survey not started',
    errorMessage: 'This survey has not started yet.',
    errorResolution: 'Please contact the survey administrator to get the survey started.<br/><br/>AgilePM Team',
  }),
  closed: () => ({
    errorTitle: 'Survey closed',
    errorMessage: 'This survey is no longer accepting responses.',
    errorResolution: 'Please contact the survey administrator if you would like to re-open the survey.<br/><br/>AgilePM Team',
  }),
  paused: () => ({
    errorTitle: 'Survey paused',
    errorMessage: 'This survey is no longer accepting responses.',
    errorResolution: 'Please contact the survey administrator if you would like to re-open the survey.<br/><br/>AgilePM Team',
  }),
  alreadyCompleted: () => ({
    errorTitle: 'Already completed',
    errorMessage: 'You have already completed this survey',
    errorResolution: 'Please contact the survey administrator to get the correct survey link.<br/><br/>AgilePM Team',
  }),
  generalError: (code, message) => ({
    errorTitle: 'We have encountered an error',
    errorMessage: `Error code ${code}: ${message}`,
    errorResolution: 'Please contact support@agilepm.cloud and provide the error code. We apologize for any inconvenience.<br/><br/>AgilePM Team',
  }),
};

const handleError = (failure, res) => {
  console.log('handleError: ', failure.response);
  let err;
  if(failure.response && failure.response.status === 404) {
    err = errors.notFound();
  } else if(failure.response && failure.response.data && failure.response.data.error) {
    const message = (failure.response.data && failure.response.data.error && failure.response.data.error.message)
      || failure.response.statusText;
    switch(failure.response.data.error.code) {
      case 1002:
        err = errors.alreadyCompleted();
        break;
      case 1003:
        err = errors.notStarted();
        break;
      case 1004:
        err = errors.paused();
        break;
      case 1005:
        err = errors.closed();
        break;
      default:
        err = errors.generalError(failure.response.status || 'no status', message || 'no message');
    }
  }
  // Handle Server timeout by returning a gateway timeout.
  else if(failure.code === 'ECONNABORTED'){
    err = errors.generalError(504, 'Gateway timeout.');
  }
  else {
    err = errors.generalError(500, 'Unable to perform request.');
  }

  return res(generateErrorPage(err, err.errorTitle));
};

// Get the Survey design
export const fetchSurvey = (res, id, cookie) => surveyHostingService({
  method: 'GET',
  url: `${id}`,
  params: {
    randomSeed: cookie.seed,
  },
})
  .then((success) => {
    // console.log('Response from server: ', success);
    let title = success.data && success.data.sections
      && success.data.sections[0] && success.data.sections[0].label;

    const initialState = {
      data: {
        [id]: { ...success.data, id },
      },
      id,
      pid: id,
    };

    let resp = res(surveyEngine(initialState, title))
      .state(SH_COOKIE_NAME, id, COOKIE_SETTINGS);
    if(cookie)
      resp = resp.state(`${SH_COOKIE_NAME}_${id}`, encodeCookie(cookie), COOKIE_SETTINGS);
    return resp;
  })
  .catch(failure => {
    console.log('fetchSurvey Error:', failure);
    return handleError(failure, res);
  });

// Submit the start activity to the backend service
export const startSurvey = (req, res, cookie, timestamp) => {


  let additionalInfo = {
    ...cookie,
    uniqueId: undefined,
    captcha: undefined,
    seed: undefined,
    userAgent: req.headers['user-agent'],
    referrer: req.info.referrer,
  };
  console.log('Additional info:', getRemoteAddr(req), additionalInfo, req.info.referrer);
  const data = {
    cookie: cookie.uniqueId,
    randomSeed: cookie.seed,
    ipAddress: getRemoteAddr(req),
    timestamp,
    type: 'START',
    additionalInfo
  };
  // console.log('Start Survey:', data, req.info);
  return surveyHostingService({
    method: 'POST',
    url: `${cookie.pid}/activities`,
    data
  }).then((success) => {
    // console.log('Response from server: ', success);
    return fetchSurvey(res, cookie.pid, cookie);
  }).catch(failure => {
    console.log('startSurvey Error:', failure);
    return handleError(failure, res);
  });
};

// validate that the request came to the correct sub-domain.
const validateSubDomain = (req) => {
  const host = req.headers.host;
  return host && (host.indexOf('localhost') === 0 || host.indexOf('survey') === 0);
};

const surveyHostingHandlers = (baseUrl) => {

  const handlers = (server, options, next) => {
    /**
     * The initRoute accepts a url from the respondent and stores a cookie with
     * parameters from the url.  This route returns the robot check which is used
     * to verify that the user is a human and not a robot.
     */
    let initRoute = {
      method: 'GET',
      path: baseUrl,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log' // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          console.log('Before Robot Query Params:', req.query, new Date());
          let { pid } = req.query;
          pid = pid || req.state[`${SH_COOKIE_NAME}`];
          if(!validateSubDomain(req) || !pid) {
            const err = errors.notFound();
            return res(generateErrorPage(err, err.errorTitle));
          }

          let surveySession = req.state[`${SH_COOKIE_NAME}_${pid}`];
          if(!surveySession) surveySession = generateCookie(req.query);
          else surveySession = { ...decodeCookie(surveySession), ...req.query };
          if(surveySession && surveySession.submitted) {
            const err = errors.alreadyCompleted();
            return res(generateErrorPage(err, err.errorTitle));
          }
          // console.log('Cookie:', surveySession, validateSession(surveySession, true));
          // If reCaptcha verification is enabled and the participant does not have a valid session, show the reCaptcha
          if(RECAPTCHA_VERIFICATION && !validateSession(surveySession, false)) {
            return res(turingTest(pid, RECAPTCHA_SITEKEY, `${baseUrl}`))
              .state(`${SH_COOKIE_NAME}_${pid}`, encodeCookie(surveySession), COOKIE_SETTINGS)
              .state(SH_COOKIE_NAME, pid, COOKIE_SETTINGS);
          }
          // if the session has already started fetch the survey
          return fetchSurvey(res, pid, surveySession);
        },
      },
    };

    let previewRoute = {
      method: 'GET',
      path: `${baseUrl}/preview`,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log' // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          let { pid, randomize, seed } = req.query;
          if(!seed && randomize) {
            seed = getSeed();
          }
          // fetch the survey in preview mode
          surveyHostingService({
            method: 'GET',
            url: `${pid}`,
            params: {
              randomSeed: seed,
            },
          })
            .then((success) => {
              // console.log('Response from server: ', success);
              let title = success.data && success.data.sections
                && success.data.sections[0] && success.data.sections[0].label;

              const initialState = {
                data: {
                  [pid]: { ...success.data, id: pid },
                },
                id: pid,
                pid,
                previewMode: true,
              };

              return res(surveyEngine(initialState, title));
            })
            .catch((failure) => {
              console.log('PreviewSurvey Error:', failure);
              handleError(failure, res);
            });
        },
      },
    };

    let errorRoute = {
      method: 'GET',
      path: `${baseUrl}/error`,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log' // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          res(generateErrorPage({
            errorTitle: 'We have encountered an error',
            errorMessage: '',
            errorResolution: 'Please contact support@agilepm.cloud and provide the error code. We apologize for any inconvenience.<br/><br/>AgilePM Team',
          }, 'We have encountered an error'))
        }
      }
    };

    /**
     * Accepts the result of the reCaptcha verifies it if valid, sends the surveyStart
     * to the BE and loads the Survey Engine.
     *
     */
    let turingRoute = {
      method: 'POST',
      path: `${baseUrl}`,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log' // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          const { pid } = req.payload;
          const captcha = req.payload['g-recaptcha-response'];
          const fingerprint = req.payload.cjfp;
          const clientDetails = JSON.parse(req.payload.cjd);
          const cookieName = `${SH_COOKIE_NAME}_${pid}`;

          let surveySession = req.state[cookieName];
          surveySession = decodeCookie(surveySession);

          if(surveySession && surveySession.submitted) {
            const err = errors.alreadyCompleted();
            return res(generateErrorPage(err, err.errorTitle));
          }

          // console.log('cookie:', cookieName, surveySession);
          const { address } = req.info;
          return validateReCaptcha(captcha, address)
            .then((verification) => {
              // console.log('captcha response:', verification.data);
              const robotTS = +moment(verification.data.challenge_ts);
              const now = +new Date();
              if(Math.abs(robotTS - now) > 1800000){
                console.log('Received Invalid Captcha Timestamp', robotTS, now);
                const err = errors.generalError('T1000', 'Unexpected Error');
                return res(generateErrorPage(err, err.errorTitle));
              }
              if(verification.data.success) {
                const hmac = createHMAC(surveySession.timestamp, captcha, surveySession.uniqueId);
                return ((surveySession && surveySession.started) ?
                  fetchSurvey(res, pid, surveySession) :
                  startSurvey(req, res, {
                    ...clientDetails,
                    ...surveySession,
                    fingerprint,
                    captcha,
                    hmac,
                  }, now));
              }
              console.log('ROBOT DETECTED:', req, verification, new Date());
              const err = errors.generalError('T800', 'Unexpected Error');
              return res(generateErrorPage(err, err.errorTitle));
            });
        }
      }
    };

    /**
     * Save the response to a single survey question.  NodeJS creates the timestamp and records the ip
     * to track when the question was submitted.
     */
    let saveRoute = {
      method: 'POST',
      path: `${baseUrl}/{pid}/save`,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log' // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          const { pid } = req.params;
          const { response, activeBranches } = req.payload;


          const requestedWith = req.headers['x-requested-with'];
          if(req.method !== 'get' && requestedWith !== 'XMLHttpRequest')
            return res(Boom.unauthorized('CSRF Header is missing or invalid'));

          let surveySession = decodeCookie(req.state[`${SH_COOKIE_NAME}_${pid}`]);
          if(validateSession(surveySession, true)) {
            const data = {
              cookie: surveySession.uniqueId,
              ipAddress: getRemoteAddr(req),
              timestamp: +new Date(),
              type: 'ANSWER',
              response: {
                ...response,
                activeBranches,
              },
            };
            console.log('Saving survey:', data, new Date());
            return surveyHostingService({
              method: 'POST',
              url: `${surveySession.pid}/activities`,
              data
            })
              .then(success => res(success.data))
              .catch(failure => res(wrapErrorResponse(failure)));
          }
          // console.log('INVALID SESSION:', req, new Date());
          return res(Boom.unauthorized());

        }
      }
    };

    /**
     * Submit the survey response.  Timestamp and ip are tracked by the NodeJS layer.
     */
    let submitRoute = {
      method: 'POST',
      path: `${baseUrl}/{pid}/submit`,
      config: {
        auth: false,
        state: {
          parse: true, // parse and store in request.state
          failAction: 'log', // may also be 'ignore' or 'error'
        },
        handler: (req, res) => {
          const { pid } = req.params;

          const requestedWith = req.headers['x-requested-with'];
          if(req.method !== 'get' && requestedWith !== 'XMLHttpRequest')
            return res(Boom.unauthorized('CSRF Header is missing or invalid'));

          let surveySession = decodeCookie(req.state[`${SH_COOKIE_NAME}_${pid}`]);
          if(surveySession.pid != pid) {
            console.log('INVALID SESSION COOKIE DOES NOT MATCH:', req, new Date());
            return res(Boom.unauthorized());
          }
          if(validateSession(surveySession, true)) {
            const data = {
              cookie: surveySession.uniqueId,
              ipAddress: getRemoteAddr(req),
              timestamp: +new Date(),
              type: 'SUBMIT',
              ...req.payload,
            };
            console.log('Submitting survey:', data);
            return surveyHostingService({
              method: 'POST',
              url: `${surveySession.pid}/activities`,
              data
            })
              .then(success => {
                console.log('submit response:', success);
                return res(success.data)
                  .state(
                    `${SH_COOKIE_NAME}_${pid}`,
                    encodeCookie({ ...surveySession, submitted: true }),
                    COOKIE_SETTINGS);
              })
              .catch(failure => res(wrapErrorResponse(failure)));
          }
          console.log('INVALID SESSION:', req);
          return res(Boom.unauthorized());

        },
      },
    };

    server.route([initRoute, turingRoute, saveRoute, submitRoute, errorRoute, previewRoute]);

    return next();
  };

  handlers.attributes = {
    name: 'surveyHosting',
    version: '0.0.0',
  };
  return handlers;
};

export default baseUrl => ({ register: surveyHostingHandlers(baseUrl) });
