// import Boom from 'boom';
import axios from 'axios';
import moment from 'moment';

import { wrapErrorResponse } from '../utils/errorHandlingUtil.js';

import { getAccessToken } from '../auth/handlers.js';
import { DUMMY_SURVEY_DATA, DUMMY_SURVEY_ANALYSIS, DUMMY_SURVEY_RESPONSES, DUMMY_SURVEY_PANELS } from './dummy.js';

const { SERVICE_PROTOCOL, SURVEY_SERVICE_BASE } = process.env;

const SURVEY_SERVICE_BASE_URL = `${ SURVEY_SERVICE_BASE }/tenants`;


// Create api axios instance for survey service.
const surveyService = axios.create({
  // URL endpoint default base.
  baseURL: SURVEY_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});


let data = [...DUMMY_SURVEY_DATA];

export const responseOverTime = (count) => {
  let rem = count;
  const today = moment().hours(0).minutes(0).seconds(0);

  let rot = [];
  let days = 0;
  while(rem > 0) {
    const c = Math.round(Math.random() * rem);
    const dt = today.add(days, 'days').unix();
    rot.push({ date: dt, responses: c });
    rem -= c;
    days -= 1;
    if(rot.length > 6)
      break;
  }
  return rot.sort((a, b) => a.date - b.date);
};

export const getSurveys = (req, res) => {
  const { id } = req.params;
  if(id) {
    const i = data.find(item => item.id === id);
    i.responsesOverTime = responseOverTime(i.qualifiedRespondents);
    return res(i);
  }
  return res(data);
};

// export const deleteSurvey = (req, res) => {
//   const { id } = req.params;
//   if(id) data = data.filter(x => x.id !== id);
//   return res('Survey Deleted.');
// };

export const createSurvey = (req, res) => {
  const { templateId, copyOfId, name, objective } = req.payload;
  const id = `${data.reduce((m, x) => Math.max(m, +x.id), 0) + 1}`;
  data.push({
    id,
    templateId,
    copyOfId,
    name,
    objective,
    questions: 0
  });
  return res({ ref: `/data/surveys/${id}` });
};
/*
export const getSurveyAnalysis = (req, res) => {
  return res(DUMMY_SURVEY_ANALYSIS);
}
*/
/*
export const getSurveyResponses = (req, res) => {
  const { rid } = req.params;
  if(rid) {
    const i = DUMMY_SURVEY_RESPONSES.content.find(item => item.id == rid);
    return res(i);
  }
  return res(DUMMY_SURVEY_RESPONSES);
};
 */
export const getPanels = (req, res) => {
  const { id } = req.params;
  if(id) {
    const i = DUMMY_SURVEY_PANELS.content.find(item => item.id == id);
    console.log('Panel:', i);
    return res(i);
  }
  return res(DUMMY_SURVEY_PANELS);
};

export const getPanelParticipants = (req, res) => {
  const { id } = req.params;
  if(id) {
    const i = DUMMY_SURVEY_PANELS.content.find(item => item.id == id);
    console.log('Panel:', i.participants);
    return res(i.participants);
  }
  return res(DUMMY_SURVEY_PANELS);
};

const createSummary = (q) => {
  console.log('creating response for ', q);
  if(!q) return;
  if(q.field && q.field.indexOf('TEXT') > -1) {
    return {
      chartType: 'wordCloud',
      question: {
        questionDetail: q,
        uniqueName: null,
        type: null,
        sstatus: null,
      },
      label: null,
      summaryData: [{
        word: 'san francisco',
        score: 100
      }, {
        word: 'san mateo',
        score: 56
      }, {
        word: 'redwood city',
        score: 34
      }, {
        word: 'menlo park',
        score: 33
      }, {
        word: 'palo alto',
        score: 25
      }, {
        word: 'burlingame',
        score: 10
      }, {
        word: 'daly city',
        score: 5
      }, {
        word: 'foster city',
        score: 16
      }, {
        word: 'belmont',
        score: 5
      }, {
        word: 'millbrae',
        score: 10
      }, {
        word: 'atherton',
        score: 8
      }, {
        word: 'east palo alto',
        score: 11
      }, {
        word: 'south san francisco',
        score: 22
      }, {
        word: 'sunnyvale',
        score: 11
      }, {
        word: 'mountain view',
        score: 77
      }, {
        word: 'los altos',
        score: 11
      }, {
        word: 'pacifica',
        score: 11
      }, {
        word: 'san jose',
        score: 150
      }],
      responses: 45,
      alternativeChartTypes: [
        'pieChart',
      ],
    };
  }
  if(q.options) {
    if(q.multiple)
      return {
        chartType: 'barChart',
        question: {
          questionDetail: q,
          uniqueName: null,
          type: null,
          sstatus: null,
        },
        label: null,
        summaryData: q.options.map(o => ({ label: o.label, value: o.value, count: Math.round(Math.random() * 100) })),
        responses: 100,
        alternativeChartTypes: [
          'pieChart',
        ],
      };
    let i = 0;
    let r = 100;
    return {
      chartType: 'pieChart',
      question: {
        questionDetail: q,
        uniqueName: null,
        type: null,
        sstatus: null,
      },
      label: null,
      summaryData: q.options.map(o => {
        let val = (i < q.options.length) ? Math.random() * (r / (q.options.length - i++)) : r;
        return { label: o.label, value: o.value, count: Math.round(val) }
      }),
      responses: 100,
      alternativeChartTypes: [
        'barChart',
      ],
    };
  }
  if(q.rows) {
    return {
      chartType: 'barChart',
      question: {
        questionDetail: q,
        uniqueName: null,
        type: null,
        sstatus: null,
      },
      label: null,
      summaryData: q.rows.map(r => ({
        label: r.label,
        count: (Math.random() * (q.range[1] - q.range[0]) + q.range[0]).toFixed(2)
      })),
      responses: 100,
      alternativeChartTypes: [
        'pieChart',
      ],
    };
  }
  if(q.range) {
    let r = [];
    for (let i = q.range[0]; i <= q.range[1]; i++)
      r.push({
        label: i,
        count: Math.round(2 * (Math.random() * (q.range[1] - q.range[0])))
      });
    return {
      chartType: 'barChart',
      question: {
        questionDetail: q,
        uniqueName: null,
        type: null,
        sstatus: null,
      },
      label: null,
      summaryData: r,
      responses: 100,
      alternativeChartTypes: [
        'pieChart',
      ],
    };
  }
};

const createResponse = (q) => {
  console.log('creating response for ', q);
  if(!q) return;
  if(q.field && q.field.indexOf('TEXT') > -1) {
    let r = '';
    const s = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
    let length = Math.round(Math.random() * 100);
    for (let i = 0; i < length; i++) {
      r += `${s[Math.floor(Math.random() * s.length)]} `;
    }
    return r;
  }
  if(q.options) {
    if(q.multiple)
      return q.options.filter(o => Math.round(Math.random()));
    return q.options && q.options[Math.ceil(Math.random() * q.options.length) - 1];
  }
  if(q.rows) {
    return q.rows.map(r => ({
      label: r.label,
      value: Math.round(Math.random() * (q.range[1] - q.range[0])) + q.range[0]
    }));
  }
  if(q.range) {
    return { value: Math.round(Math.random() * (q.range[1] - q.range[0])) + q.range[0] };
  }
};

const createRandomResponse = (design) => {
  let ret = {};
  design.sections.forEach(s => {
    s.questions.forEach(q => {
      ret[q.id] = createResponse(q);
    });
  });
  return ret;
};

// TODO: this should include the survey design id
const createRandomSummary = (design) => {
  let ret = [];
  design.sections.forEach(s => {
    s.questions.forEach(q => {
      ret.push(createSummary(q));
    });
  });
  return ret;
};

const qMessages = ['Answered too fast.', 'Over quota.'];

const statuses = [{ id: 1, displayName: 'Active' }, { id: 2, displayName: 'Quarantined' }];

const names = ['Thomas', 'James', 'Scott', 'Wallace', 'Samuel', 'Frederick', 'Jane', 'Kelly',
  'Anderson', 'Beckett', 'Brady', 'Carson', 'Carter', 'Cooper', 'Harrison', 'Jackson', 'Everly',
  'Kramer', 'Slater', 'Winston', 'Taylor', 'Tyler', 'Presley', 'Kennedy', 'McKenzie', 'Cassidy', 'Claire',
  'Lane', 'Chanel', 'Madison', 'Lee', 'Morgan', 'Reagan', 'Davis'
];

const companies = ['Acme, Inc', 'Google', 'Salesforce', 'ServiceNow', 'Microsoft', 'Apple', 'Wildcat'];

const randomName = (odd) => names[odd ? 2 * Math.floor(Math.random() * names.length / 2) + 1 : 2 * Math.floor(Math.random() * names.length / 2)];
const randomCompany = () => companies[Math.floor(Math.random() * companies.length)];

export const getSurveySummary = (req, res) => {
  let { tenant, id } = req.params;

  let accessToken = getAccessToken(req);
  return surveyService({
    method: 'GET',
    url: `${ tenant }/surveys/${ id }/design`,
    headers: {'Authorization': `Bearer ${ accessToken }`},
  })
  .then(success => res(createRandomSummary(success.data)))
  .catch((failure) => {
    // console.log('failed!', failure)
    return res(wrapErrorResponse(failure));
  });
};

export const getSurveyResponses2 = (req, res) => {
  let { tenant, id, rid } = req.params;

  let accessToken = getAccessToken(req);
  return surveyService({
    method: 'GET',
    url: `${ tenant }/surveys/${ id }/design`,
    headers: {'Authorization': `Bearer ${ accessToken }`},
  })
    .then((success) => {
      if(rid) {
        console.log('Design:', success.data);
        let responseData = createRandomResponse(success.data);
        let responseTime = Math.random() * 15;
        let totalTime = Object.keys(responseData).length * responseTime;
        let status = (responseTime > 4) ? statuses[0] : statuses[1];
        res({
          status,
          id: rid,
          firstName: randomName(),
          lastName: randomName(),
          age: Math.round((60 * Math.random()) + 18),
          company: randomCompany(),
          quarantineReason: status.id === 2 ? qMessages[Math.round(Math.random())] : '',
          submitted: moment().add(-Math.round(Math.random() * 14), 'days'),
          ip: '10.0.0.10',
          country: 'USA',
          avgResponseTime: responseTime.toFixed(2),
          totalTime: totalTime.toFixed(),
          responseData
        });
      }
      else {
        let responses = [];
        for (let i = 0; i < 10; i++) {
          let responseData = createRandomResponse(success.data);
          let responseTime = Math.random() * 15;
          let totalTime = Object.keys(responseData).length * responseTime;
          let status = (responseTime > 4) ? statuses[0] : statuses[1];
          const odd = Math.round(Math.random());
          responses.push({
            status,
            id: responses.length + 1,
            firstName: randomName(odd),
            lastName: randomName(!odd),
            age: Math.round((60 * Math.random()) + 18),
            company: randomCompany(),
            quarantineReason: status.id === 2 ? qMessages[Math.round(Math.random())] : '',
            submitted: moment().add(-Math.round(Math.random() * 14), 'days').unix(),
            ip: '10.0.0.10',
            country: 'USA',
            avgResponseTime: responseTime.toFixed(2),
            totalTime: totalTime.toFixed(),
            responseData
          });
        }

        return res({
          content: responses,
          numberOfElements: 10,
          size: 10,
          sort: null,
          totalElements: 100,
          totalPages: 10

        });
      }
    })
    .catch((failure) => {
      // console.log('failed!', failure)
      return res(wrapErrorResponse(failure));
    });
};
