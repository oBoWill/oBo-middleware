/**
 * Created by rj on 11/04/17.
 */
import axios from 'axios';

import crypto from 'crypto';

const { RECAPTCHA_SECRETKEY } = process.env;

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';

// Create api axios instance for signin service.
const reCaptchaService = axios.create({
  // URL endpoint default base.
  baseURL: 'https://www.google.com/recaptcha/api/',
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

// Calls the recaptcha verification service and returns a promise with the result
export const validateReCaptcha = (response, remoteip) => {
  return reCaptchaService({
    method: 'POST',
    url: 'siteverify',
    params: { secret: RECAPTCHA_SECRETKEY, response, remoteip }
  });
};


export const createHMAC = (time, captcha, id) => {
  const hash = crypto.createHmac('sha512', RECAPTCHA_SECRETKEY);
  hash.update(`${time}:${captcha}:${id}`);
  return hash.digest('hex');
};

export const validateHMAC = (time, captcha, id, hmac) => createHMAC(time, captcha, id) === hmac;
