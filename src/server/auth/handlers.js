'use strict';

import axios from 'axios';
import Boom from 'boom';
import HTML from '../view/HTML.js';
import { schemas } from '../schema/schemas.js';
import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import jwtDecode from 'jwt-decode';
import { getRequestFullURL, getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';

/* Axios allows us to create api client instances with default settings and behavior.
 * Currently the endpoints are loaded as env variables at 'build' time; those values
 * have defaults for building so you don't need to worry about the environment (see
 * top of 'gulpfile.js' to see those defaults).
 *
 * It would be helpful to make endpoints load dynamically at runtime from
 * a config of sorts, but that's something that can be implemented down the road.
 */

// API endpoint base constructed from env variables
const {
  COOKIE_NAME, COOKIE_PASSWORD,
  SERVICE_PROTOCOL, AUTH_SERVICE_BASE,
} = process.env;

const AUTH_SERVICE_BASE_URL = `${ AUTH_SERVICE_BASE }`;
// login endpoint
const SIGNIN_ENDPOINT = '/auth/login';
// refresh token endpoint, refresh token is provided within the header Authorization
const REFRESH_ENDPOINT = '/auth/token';
// forget password end point
const FORGOT_PASSWORD_ENDPOINT = '/auth/forgotPassword';
// reset password end point
const RESET_PASSWORD_ENDPOINT = '/auth/forgotPassword/resetPassword';

// change password end point
const CHANGE_PASSWORD_ENDPOINT = '/password';
// signup end point
const SIGNUP_ENDPOINT = '/signup';
const SIGNUP_CONFIRM_ENDPOINT = '/signup/confirm';
const TERMS_ENDPOINT = '/auth/terms';

// Create api axios instance for signin service.
export const authService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: AUTH_SERVICE_BASE_URL,
  // Fails if request takes longer than 30 seconds. this needs be configurable
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

export function validateAuthRedirect(req) {
  const redirect = `/signin${ (req.url.path && req.url.path.length > 1) ? (`?redirect=${req.url.path}`) : ''}`;
  console.log('redirecting to ', redirect, req.url);
  return redirect;
}

export function validateCookieAuth(req, session, callback) {


  // Log messaging:
  const timestamp = Date.now();  // we need logging framework to add this later
  const url = getRequestFullURL(req);
  console.log(`[${timestamp}] validateCookieAuth url: ${url}`);

  const requestedWith = req.headers['x-requested-with'];
  if(req.method !== 'get' && requestedWith !== 'XMLHttpRequest')
    return callback('CSRF Header is missing or invalid', false, null);
  // hapi cookie auth has decorator so we can set the state
  let res = req.cookieAuth.reply;
  let access = jwtDecode(session.token);
  let refresh = jwtDecode(session.refreshToken);

  if(refresh.exp * 1000 <= timestamp) {
    // refresh token expired .. invalidate the cookie & session
    console.log(`[${timestamp}] validateCookieAuth: Refresh token expired, need re-authentication`);
    res.unstate(COOKIE_NAME);
    return callback(null, false, null);

  } else if(access.exp * 1000 <= timestamp) {
    // access token expired, but refresh token can still be used
    console.log(`[${timestamp}] Access token expired, refreshing token is still valid.`);
    let params = {};
    let config = { headers: { Authorization: `Bearer ${session.refreshToken}` } };
    return authService.post(REFRESH_ENDPOINT, params, config)
      .then((success) => {
        let newTokens = { token: success.data.token, refreshToken: session.refreshToken };
        let msg = `[${timestamp}] validateCookieAuth: token refresh success`;
        console.log(msg);
        /**
         * This sets the new cookie in the request's internal _states. it does not update req.state which is a different state,
         * in hapi framework, req.state is parsed based browser cookie, req._states is from newly updates,
         * this line is actually not needed,will clean next time
         */
        res.state(COOKIE_NAME, newTokens);
        /**
         * Last argument provides tokens as req.auth.credentials for future use in the req's life cycle.
         */
        console.info('success');
        return callback(null, true, newTokens);
      })
      .catch((failure) => {
        let msg = `[${timestamp}] Token refreshing failed`;
        console.log(msg);
        return callback(msg, false, null);
      });
  }

  let msg = `[${timestamp}] Using valid access token`;
  console.log(msg);
  // both access token and refresh token are valid
  return callback(null, true, null);
}

/**
 * Returns the user permissions
 */
export function getUserPermissions(req, callback) {
  let accessToken = getAccessToken(req);
  let accessTokenBody = jwtDecode(accessToken);
  let endPoint = `/tenants/${accessTokenBody.tun}/permissions/userPermissions/${accessTokenBody.uid}`;
  console.log(endPoint);

  return authService({
    method: 'GET',
    url: endPoint,
    headers: getHttpHeaders(req),
  }).then((success) => {
    console.log(`Got user permissions ${JSON.stringify(success.data)}`);
    return callback(null, success.data);
  }).catch((failure) => {
    console.log('failure:', failure.response);
    const resp = wrapErrorResponse(failure);
    return callback('Failed to get user permissions', resp);
  });
}

/**
 * Returns the user permissions
 */
export function getStaticResourcePermissions(req, tun, callback) {
  let endPoint = `/tenants/${tun}/permissions`;

  return authService({
    method: 'GET',
    url: endPoint,
    headers: getHttpHeaders(req),
  }).then((success) => {
    console.info(`Got static permissions permissions ${JSON.stringify(success.data)} ${endPoint}`);
    return callback(null, success.data);
  }).catch((failure) => {
    console.log('failure:', failure.response);
    const resp = wrapErrorResponse(failure);
    return callback('Failed to get static permissions', resp);
  });
}

export function signin(req, res, payload = null) {
  let apmCookie = req.state[COOKIE_NAME];
  if(apmCookie) {
    console.log('User already logged in!');
    // just return the same cookie;
    if(req.method === 'post')
      return res(apmCookie);

    return res.redirect('/');
  }

  if(req.method === 'get') {
    let endPoint = `/tenants/root/permissions`;
    console.info('Endpoint', endPoint);
    return authService({
      method: 'GET',
      url: endPoint,
      headers: getHttpHeaders(req),
    }).then((success) => {
      console.info(`signin: ${JSON.stringify(success.data)}`);
      let initialState = {
        ...schemas,
        session: {
          data: {
            staticPermissions: success.data.content,
          },
        },
      };
      return res(HTML(initialState, 'APM'));
    }).catch((failure) => {
      console.error('failure:', failure.response.data);
      return res(failure.response.data);
    });
  }

  let params = payload;
  if(!params)
    params = req.payload;

  // console.log(params);
  return authService({
    method: 'POST',
    url: SIGNIN_ENDPOINT,
    headers: getHttpHeaders(req, false),
    data: params })
  // Sends data to client:
    .then((success) => {
      // console.log(success.data);
      let accessTokenBody = jwtDecode(success.data.token);
      let refreshTokenBody = jwtDecode(success.data.refreshToken);
      // console.log("accessTokenBody: " + JSON.stringify(accessTokenBody) + " \nrefreshTokenBody: " +  JSON.stringify(refreshTokenBody));
      return res(success.data).state(COOKIE_NAME, success.data);
    })
    // Sends error to client:
    .catch((failure) => {
      if(failure.response && failure.response.status === 401 && failure.response.data && failure.response.data.resetPasswordToken) {
        res(failure.response.data).code(401);
      } else {
        console.log('failure:', failure.response);
        const resp = wrapErrorResponse(failure);
        res(resp);
      }
    });
}

export function signupConfirm(req, res) {
  console.log('signupConfirm:', getRequestFullURL(req));
  let params = req.query;
  let endpoint = SIGNUP_CONFIRM_ENDPOINT;
  if(params.token)
    endpoint += `?token=${params.token}`;
  else
    return res(Boom.badData('Signup confirm token is required.'));

  return authService({
    method: 'GET',
    url: endpoint }
  )
    .then((success) => {
      // console.log('response:', success.data);
      console.log('signupConfirm success');
      return res(HTML(schemas, 'APM'));
    })
    .catch((failure) => { // Sends error to client using wrapErrorResponse to convert to Boom.js Errors:
      try{
        console.log('error response:', failure);
        const resp = wrapErrorResponse(failure);
        res(resp);
      } catch(e) {
        console.log('ERROR: Exception caught handling error response!', e);
      }
    });
}

export function signup(req, res) {
  let apmCookie = req.state[COOKIE_NAME];
  if(apmCookie) {
    console.log('User already logged in!');
    return res.redirect('/');
  }

  if(req.method === 'get') {
    let endPoint = `/tenants/root/permissions`;
    return authService({
      method: 'GET',
      url: endPoint,
      headers: getHttpHeaders(req),
    }).then((success) => {
      let initialState = {
        ...schemas,
        session: {
          data: {
            staticPermissions: success.data.content,
          },
        },
      };
      return res(HTML(initialState, 'APM'));
    }).catch((failure) => {
      console.error(`failure: ${JSON.stringify(failure.response)}`);
      return res(wrapErrorResponse(failure));
    });
  }

  let params = req.payload;
  return authService({
	    method: 'POST',
	    url: SIGNUP_ENDPOINT,
	    data: params })
    .then((success) => {
      // console.log('response:', success.data);
      console.log('sign up success');
      return res(success.data);
    })
    // Sends error to client using wrapErrorResponse to convert to Boom.js Errors:
    .catch((failure) => {
      try {
        console.log('error response:', failure);
        const resp = wrapErrorResponse(failure);
        res(resp);
      }
      catch (e) {
        console.log('ERROR: Exception caught handling error response!', e);
      }
    });
}

export function forgotPassword(req, res) {
  if (req.method == 'get') {
    let endPoint = `/tenants/root/permissions`;
    return authService({
      method: 'GET',
      url: endPoint,
      headers: getHttpHeaders(req),
    }).then((success) => {
      let initialState = {
        ...schemas,
        session: {
          data: {
            staticPermissions: success.data.content,
          },
        },
      };
      return res(HTML(initialState, 'APM'));
    }).catch((failure) => {
      console.error(`failure: ${JSON.stringify(failure.response)}`);
      return res(wrapErrorResponse(failure));
    });
  }
  let params = req.payload;
  if (!params.email) {
    return res(Boom.badData('Email address is required.'));
  }
  console.log('email=' + encodeURI(params.email));
  return authService({
    method: 'POST',
    url: FORGOT_PASSWORD_ENDPOINT,
    data: params}
  )
    .then((success) => {
      // console.log('response:', success.data);
      console.log('forgotPassword up success');
      return res(success.data)
    })
    .catch((failure) => { // Sends error to client using wrapErrorResponse to convert to Boom.js Errors:
      try {
        console.log('error response:', failure);
        const resp = wrapErrorResponse(failure);
        res(resp);
      }
      catch (e) {
        console.log('ERROR: Exception caught handling error response!', e);
      }
    });
}

export function resetPassword(req, res) {
  // console.log('resetPassword:', getRequestFullURL(req));
  if(req.method === 'get')
    return res(HTML(schemas, 'APM'));

  let params = req.payload;
  if(!params.newPassword)
    return res(Boom.badData('New password is required.'));

  let data = {};
  data.password = params.newPassword; // map to user object's password
  let endpoint = RESET_PASSWORD_ENDPOINT;
  let resetPasswordTokenBody = {};
  if(params.token) {
    endpoint += `/${params.token}`;
    resetPasswordTokenBody = jwtDecode(params.token);
  }

  return authService({
    method: 'POST',
    url: endpoint,
    data }
  )
    .then((success) => {
      // console.log('response:', success.data);
      console.log('resetPassword up success');
      if(resetPasswordTokenBody.cpr === 1) {
        return signin(req, res,
          {
            email: resetPasswordTokenBody.sub,
            password: params.newPassword,
          });
      }
      return res(success.data);
    })
    .catch((failure) => { // Sends error to client using wrapErrorResponse to convert to Boom.js Errors:
      try{
        console.log('error response:', failure);
        const resp = wrapErrorResponse(failure);
        res(resp);
      } catch(e) {
        console.log('ERROR: Exception caught handling error response!', e);
      }
    });
}

// returns the terms pdf
export function terms(req, res) {
  return authService({
    method: 'GET',
    url: TERMS_ENDPOINT,
    headers: getHttpHeaders(req, false, [], null),
    responseType: 'arraybuffer',
  })
  .then((success) => {
    let result = res(success.data);
    result.type(success.headers['content-type']);
    result.header('Content-Disposition', success.headers['content-disposition']);
    return result;
  }
  ).catch(failure => res(wrapErrorResponse(failure)));
}

export function createUserConfirm(req, res) {
  let token = jwtDecode(req.query.token);
  let id = token.uid;
  let tenant = token.tun;
  let endpoint = `/tenants/${tenant}/users/${id}/confirm?token=${req.query.token}`;

  return authService({
    method: 'GET',
    url: endpoint,
  })
    .then(success => res(HTML(schemas, 'APM')))
    .catch(failure => res(wrapErrorResponse(failure)));
}


export function changePassword(req, res) {
    let { tenant, id, newPassword, oldPassword } = req.payload;
    let data = {
      newPassword,
      oldPassword,
    };

    return authService({
        method: 'POST',
        url: `/tenants/${tenant}/users/${id}/${CHANGE_PASSWORD_ENDPOINT}`,
        data: data,
        headers: getHttpHeaders(req),
        }
    )
        .then((success) => {
            return res(success.data)
        })
        .catch((failure) => { // Sends error to client using wrapErrorResponse to convert to Boom.js Errors:
            try {
                console.log('error response:', failure);
                const resp = wrapErrorResponse(failure);
                res(resp);
            }
            catch (e) {
                console.log('ERROR: Exception caught handling error response!', e);
            }
        });
}


export function signout(req, res) {
  return res(200).unstate(COOKIE_NAME);
}
