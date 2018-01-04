'use strict';

import { validateTokenHandler } from '../auth/handlers.js';
const { COOKIE_NAME } = process.env;

export function getRequestFullURL(req) {
  const url = `${req.connection.info.protocol}://${req.info.host}${req.url.path}`;
  return url;
}

/**
 * After token refreshed, hapi auth only updates req.auth.credentials,
 * so it needs read the new token if it is available other use existing cookie
 */
export function getAccessToken(req) {
  // console.log("getAccessToken called : " + req.state[COOKIE_NAME].token);
  let session = req.auth.credentials;  // this normally is already set after validateFunc, just in case to check NPE
  if(!session)
    session = req.state[COOKIE_NAME];

  if(!session) {
    console.log('Cookie does not exist.');
    let url = getRequestFullURL(req);
    console.log(`getAccessToken requesting url: ${url}`);
    return null;
  }

  return session.token;
}

export function getRefreshToken(req) {
  let session = req.auth.credentials;
  if(!session)
    session = req.state[COOKIE_NAME];

  if(!session) {
    console.log('Cookie does not exist.');
    let url = getRequestFullURL(req);
    console.log(`getRefreshToken requesting url: ${url}`);
    return null;
  }

  return session.refreshToken;
}

/**
 * For ip validation, we need do it in nodejs as we don't forward x-forwarded-for headers now.
 * host will be set by axios client automatically.
 */
const defaultForwardHttpHeaders = ['accept', 'accept-encoding', 'accept-language', 'user-agent', 'content-type'];

/**
 * Currently backend services only do json
 * Return the headers with additional auth token.
 * additionalForwardHeaders defines what additional headers (array) will be forwarded based on original http req.
 * by default we only forward the selected default headers
 */
export function getHttpHeaders(req, includeAuthToken = true,
  additionalForwardHeaders = [], accept = 'application/json') {

  let httpHeaders = {};
  /**
   * define what headers will be forwarded to axios client.
   */
  let forwardHeaders = defaultForwardHttpHeaders.slice(0);
  // add the additional headers if there are
  if(additionalForwardHeaders && additionalForwardHeaders.length > 0)
    forwardHeaders = forwardHeaders.concat(additionalForwardHeaders);

  let originalHeaders = req.headers;
  forwardHeaders.forEach((headerName) => {
    // only forward if there is such http header originally
    if(originalHeaders[headerName])
      httpHeaders[headerName] = originalHeaders[headerName];
  });

  // if we need overwrite the accept http header
  if(accept)
    httpHeaders.accept = accept;

  // if we need include the auth token http header
  if(includeAuthToken) {
    let accessToken = getAccessToken(req);
    httpHeaders.Authorization = `Bearer ${accessToken}`;
  }
  return httpHeaders;
}
