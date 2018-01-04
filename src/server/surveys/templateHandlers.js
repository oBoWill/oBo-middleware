import axios from 'axios';
import { getAccessToken, getHttpHeaders } from '../utils/httpUtil.js';
import https from 'https';
import fs from 'fs';
import { apmServiceApiHttpsAgent } from '../security/sslUtil.js';

const { SERVICE_PROTOCOL, SURVEY_SERVICE_BASE } = process.env;


const SURVEY_SERVICE_BASE_URL = `${ SURVEY_SERVICE_BASE }/tenants`;

// Create api axios instance for survey service.
const surveyService = axios.create({
  httpsAgent: apmServiceApiHttpsAgent,
  // URL endpoint default base.
  baseURL: SURVEY_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

const categoryColorMap = {
  blank: 'white',
  competitive: 'pink lighten-2',
  strategy: 'purple lighten-3',
  concept: 'purple lighten-1',
  prioritization: 'blue',
  experience: 'blue lighten-2',
};

export const getPagedTemplates = (req, res) => {
  let { tenant, page, size, id } = req.params;

  let endpoint = `${ tenant }/surveyTemplates`;
  if (id)
    endpoint = `${ tenant }/surveyTemplates/${ id }`;
    return surveyService({
      method: 'GET',
      url: endpoint,
      headers: getHttpHeaders(req),
    })
      .then((success) => {
        console.log('success:', success);
        const templates = success.data.content.map(t => ({ ...t, color: categoryColorMap[t.category] }));
        return res({ ...success.data, content: templates });
      })
      .catch((failure) => {
        console.log('failed!', failure)
        return res(failure.response.data);
      });
}


export const createOrUpdateTemplate = (req, res) => {
  let {tenant, id} = req.params;

  let endpoint = `${ tenant }/surveyTemplates`;
  if (id)
    endpoint = `${ tenant }/surveyTemplates/ ${ id }`;
  return surveyService({
    method: 'POST',
    url: endpoint,
    data: req.payload,
    headers: getHttpHeaders(req),
  })
    .then((success) => {
      return res(success.data);
    })
    .catch((failure) => {
      // console.log('failed!', failure)
      return res(failure.response.data);
    });
}
