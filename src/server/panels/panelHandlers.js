import axios from 'axios';

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';
import {getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';

const { SERVICE_PROTOCOL, SURVEY_SERVICE_BASE } = process.env;

const PANEL_SERVICE_BASE_URL = `${ SURVEY_SERVICE_BASE }/tenants`;


// Create api axios instance for panel service.
const panelService = axios.create({
  // URL endpoint default base.
  baseURL: PANEL_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

// returns panels in pagination w/ params (page, size)
export const getPagedPanels = (req, res) => {
  let { tenant, page, size, id } = req.params;

  let endpoint = `/${tenant}/panels`;
  if(id)
    endpoint = `/${tenant}/panels/${id}`;

  return panelService({
    method: 'GET',
    params : req.query,
    url: endpoint,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      return res(wrapErrorResponse(failure));
    });
}


export const writePanel = (req, res) => {
  let { copyFrom, name, description, audienceType } = req.payload;
  let { tenant, id } = req.params;
  let endpoint;
  if(id)
    endpoint = `${tenant}/panels/${id}`;
  else
    endpoint = `${tenant}/panels`;
  //copy from another panel
  console.log('Sending Panel Request:', endpoint, req.payload);
  return panelService({
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

export const uploadPanel = (req, res) => {
  let { tenant, id } = req.params;
  let endpoint = `/${tenant}/panels/${id}/upload`;
  //copy from another panel
  return panelService({
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

export const deletePanel = (req, res) => {
  let { tenant, id } = req.params;
  return panelService({
    method: 'DELETE',
    url: `${ tenant }/panels/${ id }`,
    headers: getHttpHeaders(req),
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}


export const updatePanel = (req, res) => {
  let payload = req.payload;
  let { tenant, id } = req.params;
  return panelService({
    method: 'POST',
    url: `${ tenant }/panels/${ id }`,
    headers: getHttpHeaders(req),
    data: payload
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}

export const getPanelPeople = (req, res) => {
  let { tenant, id } = req.params;
  return panelService({
    method: 'GET',
    headers: getHttpHeaders(req),
    url: `${tenant}/panels/${id}/people`
  })
  .then((success) => {
    let data = success.data;
    return res(data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
}

export const updatePanelParticipants = (req, res) => {
  let { tenant, id } = req.params;
  let pl = req.payload;

  let data = {
    numberExpectedRespondents: pl.numberTargetedResponses,
    estimatedTimeInMinute: pl.estimatedTimeInMinute,
    criteria: pl
  }

  for (var i in pl) {
    data[i] = pl[i];
  }
  return panelService({
    method: 'POST',
    headers: getHttpHeaders(req),
    url: `${ tenant }/panels/${ id }/people`,
    data: data
  })
  .then((success) => {
    return res(success.data);
  })
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
};


// export const runPanelAction = (req, res) => {
//   let { tenant, id } = req.params;
//   console.log('run action', req.payload)
//
//   return panelService({
//     method: 'POST',
//     headers: getHttpHeaders(req),
//     url: `${ tenant }/panels/${ id }/actions`,
//     params: req.payload
//   })
//   .then((success) => {
//     return res(success.data);
//   })
//   .catch((failure) => {
//     // console.log('failed!', failure)
//     return res(wrapErrorResponse(failure));
//   });
// };
