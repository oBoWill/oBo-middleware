import axios from 'axios';
import { getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';

const { SERVICE_PROTOCOL, ENUM_SERVICE_BASE } = process.env;

const ENUM_SERVICE_BASE_URL = `${ ENUM_SERVICE_BASE }/tenants`;


export const enumService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: ENUM_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});


export const getEnums = (req, res) => {
  let { tenant, enumType } = req.params;

  return enumService({
    method: 'GET',
    url: `${ tenant }/enums/${ enumType }`,
    headers: getHttpHeaders(req),
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    console.log('failed!', failure);
    return res(wrapErrorResponse(failure));
  });
};
