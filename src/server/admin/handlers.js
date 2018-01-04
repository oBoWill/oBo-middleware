import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';

const { SERVICE_PROTOCOL, IMPORT_SERVICE_BASE } = process.env;


const IMPORT_SERVICE_BASE_URL = `${ IMPORT_SERVICE_BASE }`;

export const importService = axios.create({
  // URL endpoint default base.
  baseURL: IMPORT_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT
});

export const getImportLog = (req, res) => {
  let { tenant } = req.params;
  let endpoint = `/tenants/${tenant}/admin/import`;

  return importService({
      method: 'GET',
      url: endpoint,
      headers: getHttpHeaders(req),
    })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      console.log('failed!', failure)
      return res(failure.response.data);
    });
};

export const dataImport = (req, res) => {
  let { tenant } = req.params;

  let endpoint = `/tenants/${tenant}/admin/import`;
  return importService({
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
};


export const downloadImportFileHandler = (req, res) => {
  const { id, } = req.params;
  let accessToken = getAccessToken(req);
  let accessTokenBody = jwtDecode(accessToken);

  return importService({
    method: 'GET',
    url: `/tenants/${accessTokenBody.tun}/admin/import/${id}/download`,
    responseType: 'arraybuffer',
    headers: getHttpHeaders(req),
  }).then((success) => {
    const result = res(success.data);
    result.type(success.headers['content-type']);
    result.header('Content-Disposition', success.headers['content-disposition']);
    return result;
  }).catch((failure) => {
    console.log('failed!', failure);
    return res(wrapErrorResponse(failure))
  });
};
