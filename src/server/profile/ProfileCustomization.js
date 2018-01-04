import axios from 'axios';

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import { getHttpHeaders } from '../utils/httpUtil.js';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';

const { SERVICE_PROTOCOL, SOR_SERVICE_BASE, AUTH_SERVICE_BASE } = process.env;

const SOR_SERVICE_BASE_URL = `${ SOR_SERVICE_BASE }/tenants`;

const USER_SERVICE_BASE_URL = `${ AUTH_SERVICE_BASE }/tenants`
// 'http://172.31.44.112:9090/api/v0/tenants';

// Create api axios instance for survey service.
const sorService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: SOR_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

// Create api axios instance for users service.
const usersService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: USER_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

//returns surveys in pagination w/ params (page, size)
export const createCustomField = (req, res) => {
  let { tenant, id } = req.params;
  let endpoint = id ? `${tenant}/admin/customFields/${id}` : `${tenant}/admin/customFields`;

  return sorService({
    method: 'POST',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),

  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
}

//returns surveys in pagination w/ params (page, size)
export const deleteCustomField = (req, res) => {
  let { tenant, id } = req.params;

  let endpoint = `${tenant}/admin/customFields/${id}`;

  return sorService({
    method: 'DELETE',
    url: endpoint,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
};

export const getPagedUsers = (req, res) => {
  let { tenant, page, size, id } = req.params;

  let endpoint = `/${tenant}/users/`;
  if(id)
    endpoint = `/${tenant}/users/${id}`;

  return usersService({
    method: 'GET',
    params: req.query,
    url: endpoint,
    headers: getHttpHeaders(req),
  })
    .then(success => res(success.data))
    .catch(failure => res(wrapErrorResponse(failure)));
};

export const saveUser = (req, res) => {
  let { tenant, id } = req.params;

  let endpoint = `/${tenant}/users/`;
  let data = req.payload;
  if(id) {
    endpoint = `/${tenant}/users/${id}`;
  } else {
    data = { ...data, password: 'welcome1' };
  }

  return usersService({
    method: 'POST',
    url: endpoint,
    data,
    headers: getHttpHeaders(req),
  })
    .then(success => res(success.data))
    .catch(failure => res(wrapErrorResponse(failure)));
};

export const deleteUser = (req, res) => {
  let { tenant, id } = req.params;
  let data = { tenant, id };
  let endpoint = `/${tenant}/users/${id}`;

  return usersService({
    method: 'DELETE',
    url: endpoint,
    data,
    headers: getHttpHeaders(req),
  })
    .then(success => res(success.data))
    .catch(failure => res(wrapErrorResponse(failure)));
};

export const deleteAvatar = (req, res) => {
  let { tenant, id } = req.params;
  let data = { tenant, id };
  let endpoint = `/${tenant}/users/${id}/thumbnail`;

  return usersService({
    method: 'DELETE',
    url: endpoint,
    data,
    headers: getHttpHeaders(req),
  })
    .then(success => res(success.data))
    .catch(failure => res(wrapErrorResponse(failure)));
};

export const uploadProfile = (req, res) => {
  let { tenant, objectType } = req.params;
  let endpoint = `/${tenant}/${objectType}/upload`;
  // copy from another panel
  return sorService({
      method: 'POST',
      url: endpoint,
      data: req.payload,
      headers: getHttpHeaders(req),
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}

export const uploadAvatar = (req, res) => {
  let { tenant, id } = req.params;

  let endpoint = `/${ tenant }/users/${ id }/attachments`;

  let data = req.payload;

    return usersService({
      method: 'POST',
      url: endpoint,
      data,
      headers: getHttpHeaders(req),
    })

    .then((success) => {
      return res(success.data);
    })

    .catch((failure) => {
      console.log('FAILURE:', failure);
      return res(wrapErrorResponse(failure));
    });
}
