import expectLib from 'expect';
// import axios from 'axios';
import Boom from 'boom';
import MockAdapter from 'axios-mock-adapter';


import {
  surveyService,
  getPagedSurveys,
  newSurvey,
  deleteSurvey,
  updateSurvey,
  getSurveyDesign,
  updateSurveyDesign,
  getSurveyDetails,
  updateSurveyDetails,
  getSurveyParticipants,
  updateSurveyParticipants,
  updateEstimate,
  runSurveyAction,
  getSurveyComments,
  createSurveyComments,
  updateSurveyComment,
  deleteSurveyComments,
  getSurveyAttachments,
  uploadSurveyAttachment,
  downloadSurveyAttachment,
  deleteSurveyAttachment,
  createSurveyPanel,
  getSurveyPanel,
  getSurveyPanelInfo,
  getSurveyExport,
  getSurveyResponses,
  getSurveyTimeline,
  getSurveyAnalysis
} from '../surveyHandlers';

// const { SERVICE_PROTOCOL, SURVEY_SERVICE_BASE } = process.env;

// const SURVEY_SERVICE_BASE_URL = `${ SURVEY_SERVICE_BASE }/tenants`;

const date = new Date();

const axiosMock = new MockAdapter(surveyService);
jest.mock('../../auth/handlers', () => ({}));
jest.mock('../../utils/httpUtil', () => ({
  getAccessToken: () => '1234567890',
  getHttpHeaders: () => ({
    'Authorization': `1234567890`
  }),
}));
jest.mock('../../security/sslUtil', () => ({}));
const consoleMock = expectLib.spyOn(console, 'log');

// beforeAll((done) => {
//   server.start(() => {
//     done();
//   })
// });
afterAll((done) => {
  jest.unmock('../../auth/handlers');
  jest.unmock('../../security/sslUtil');
  jest.unmock('../../utils/httpUtil');
  axiosMock.restore();
  consoleMock.restore();
});
afterEach(() => {
  axiosMock.reset();
});

const fetchRes = {
  id: '20003',
  sections: [
    {label: 'Test'}
  ]
};
const _props = {
  data: {
      '20003': { ...fetchRes },
  },
  id: '20003',
  pid: '20003'
};

const tenant = 'testing';
const id = '20003';

const _req = {
  info: {
    referer: 'referer',
    remoteAddress: 'localhost',
  },
  params: {
    tenant,
    id: '20003'
  },
  query: {
    owner: '9',
    size: '50'
  },
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.91 Safari/537.36',
  }
};

const mockRes = (params) => ({state: () => ({state: () => params})});

const testForSimpleHandlers = (method, url, handler, success = true, req = _req) => {
  if (method === 'GET') {
    axiosMock.onGet(url).reply(success ? 200 : 400, fetchRes);
    const res = jest.fn();
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() => {
      return expect(res).toHaveBeenCalledWith(success ? fetchRes : Boom.badRequest());
    });
  }
  if (method === 'POST') {
    axiosMock.onPost(url).reply(success ? 200 : 400, fetchRes);
    const res = jest.fn();
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() => {
      return expect(res).toHaveBeenCalledWith(success ? fetchRes : Boom.badRequest());
    });
  }
  if (method === 'DELETE') {
    axiosMock.onDelete(url).reply(success ? 200 : 400, fetchRes);
    const res = jest.fn();
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() => {
      return expect(res).toHaveBeenCalledWith(success ? fetchRes : Boom.badRequest());
    });
  }
  return Promise.reject();
}

describe('surveyHandlers', () => {
  describe('getPagedSurvey', () => {
    it('should return paged survey by id', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003`, getPagedSurveys, true);
    });

    it('should return paged survey', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys`, getPagedSurveys, true, {..._req, params: {..._req.params, id: undefined}});
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003`, getPagedSurveys, false);
    });
  });

  describe('newSurvey', () => {
    const payload = {
      name: 'name',
      description: null,
      audienceType: {id: 2, uniqueName: "b2c", value: 1, description: "", displayName: "B2C", isDefault: false},
    };
    const req = {
      ..._req,
      payload
    };
    // beforeEach(() => {
    //   axiosMock.onPost(`${ tenant }/surveys`).reply((config) => {
    //     return [200, config.params || {}];
    //   });
    // });

    it('should create empty survey', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys`, newSurvey, true, req);
    });

    it('should copy survey', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys`, newSurvey, true, {...req, payload: {...payload, copyFrom: '20003'}});
    });

    it('should create survey from template', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys`, newSurvey, true, {...req, payload: {...payload, templateId: '1'}});
    });

    it('should return error on fail', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys`, newSurvey, false, req);
    });

  });

  describe('deleteSurvey', () => {
    it('should be success', () => {
      return testForSimpleHandlers('DELETE', `${ tenant }/surveys/${ id }`, deleteSurvey, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('DELETE', `${ tenant }/surveys/${ id }`, deleteSurvey, false);
    });
  });

  describe('updateSurvey', () => {
    const payload = {
      name: 'name',
    };
    const req = {
      ..._req,
      payload
    };
    it('should be success', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003`, updateSurvey, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003`, updateSurvey, false, req);
    });
  });

  describe('getSurveyDesign', () => {

    it('should be success', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003/design`, getSurveyDesign, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003/design`, getSurveyDesign, false);
    });
  });

  describe('updateSurveyDesign', () => {
    const payload = {
      name: 'name',
    };
    const req = {
      ..._req,
      payload
    };
    it('should be success', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/design`, updateSurveyDesign, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/design`, updateSurveyDesign, false, req);
    });
  });

  describe('getSurveyDetails', () => {

    it('should be success', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003/details`, getSurveyDetails, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003/details`, getSurveyDetails, false);
    });
  });

  describe('updateSurveyDetails', () => {
    const payload = {
      name: 'name',
    };
    const req = {
      ..._req,
      payload
    };
    it('should be success', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/details`, updateSurveyDetails, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/details`, updateSurveyDetails, false, req);
    });
  });

  describe('getSurveyParticipants', () => {
    it('should be success', () => {
      axiosMock.onGet(`${ tenant }/surveys/20003/participants`).reply(200, {
        numberExpectedRespondents: '100',
        estimatedTimeInMinute: '10',
        criteria: {
          companySizeBracket: [
            {displayName: "< 10", id: 1, uniqueName: "<10"}
          ]
        },
      })
      const res = jest.fn();
      return getSurveyParticipants(_req, res).then(() => {
        return expect(res).toHaveBeenCalledWith({
          numberExpectedRespondents: '100',
          estimatedTimeInMinute: '10',
          criteria: {
            companySizeBracket: [
              {displayName: "< 10", id: 1, uniqueName: "<10"}
            ],
            numberParticipants: '100',
            estimatedTimeInMinute: '10',
            numberExpectedRespondents: '100',
          }
        })
      })
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/20003/participants`, getSurveyParticipants, false);
    });
  });

  describe('updateSurveyParticipants', () => {
    const payload = {
      name: 'name',
      numberTargetedResponses: '100',
      estimatedTimeInMinute: '10',
    };
    const req = {
      ..._req,
      payload
    };
    it('should be success', () => {
      axiosMock.onPost(`${ tenant }/surveys/20003/participants`).reply((config) => {
        return [200, config.data]
      })
      const res = jest.fn();
      return updateSurveyParticipants(req, res).then(() => {
        return expect(res).toHaveBeenCalledWith({
          ...payload,
          numberExpectedRespondents: payload.numberTargetedResponses,
          criteria: {
            ...payload
          }
        })
      })
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/participants`, updateSurveyParticipants, false, req);
    });
  });


  describe('updateEstimate', () => {
    it('should be success', () => {
      axiosMock.onPost(`${ tenant }/surveys/20003/estimate`).reply(200, {
        numberExpectedRespondents: '100',
        estimatedTimeInMinute: '10',
        criteria: {
          companySizeBracket: [
            {displayName: "< 10", id: 1, uniqueName: "<10"}
          ]
        },
      })
      const res = jest.fn();
      return updateEstimate(_req, res).then(() => {
        return expect(res).toHaveBeenCalledWith({
          companySizeBracket: [
            {displayName: "< 10", id: 1, uniqueName: "<10"}
          ],
          estimatedTimeInMinute: '10',
          numberExpectedRespondents: '100',
        })
      })
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/20003/estimate`, updateEstimate, false, _req);
    });
  });

  describe('runSurveyAction', () => {
    const payload = {
      name: 'name',
    };
    const req = {
      ..._req,
      payload
    };
    it('should be success', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/${ id }/actions`, runSurveyAction, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `${ tenant }/surveys/${ id }/actions`, runSurveyAction, false, req);
    });
  });

  describe('getSurveyComments', () => {

    it('should be success', () => {
      return testForSimpleHandlers('GET', `${tenant}/surveys/${id}/comments`, getSurveyComments, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${tenant}/surveys/${id}/comments`, getSurveyComments, false);
    });
  });

  describe('createSurveyComments', () => {
    const payload = {
      name: 'name',
    };

    const req = {
      ..._req,
      query: {},
      payload
    };

    it('should be success', () => {
      return testForSimpleHandlers('POST', `${tenant}/surveys/${id}/comments`, createSurveyComments, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${id}/comments`, createSurveyComments, false, req);
    });
  });

  describe('deleteSurveyComments', () => {
    const payload = {
      name: 'name',
    };

    const cid = '123';
    const req = {
      ..._req,
      params: {
        ..._req.params,
        cid,
      },
      query: {},
      payload
    };


    it('should be success', () => {
      return testForSimpleHandlers('DELETE', `${tenant}/surveys/${id}/comments/${cid}`, deleteSurveyComments, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('DELETE', `/${tenant}/surveys/${id}/comments/${cid}`, deleteSurveyComments, false, req);
    });
  });

  describe('updateSurveyComment', () => {
    const payload = {
      name: 'name',
    };

    const cid = '123';
    const req = {
      ..._req,
      params: {
        ..._req.params,
        cid,
      },
      query: {},
      payload
    };


    it('should be success', () => {
      return testForSimpleHandlers('POST', `${tenant}/surveys/${id}/comments/${cid}`, updateSurveyComment, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${id}/comments/${cid}`, updateSurveyComment, false, req);
    });
  });

  describe('getSurveyAttachments', () => {
    it('should be success', () => {
      return testForSimpleHandlers('GET', `${tenant}/surveys/${id}/attachments`, getSurveyAttachments, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${tenant}/surveys/${id}/attachments`, getSurveyAttachments, false);
    });
  });

  describe('uploadSurveyAttachment', () => {
    const payload = {
      name: 'name',
    };

    const req = {
      ..._req,
      query: {},
      payload
    };
    it('should be success', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${id}/attachments/`, uploadSurveyAttachment, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${id}/attachments/`, uploadSurveyAttachment, false, req);
    });
  });

  describe('downloadSurveyAttachment', () => {
    const fid = '123';
    const req = {
      ..._req,
      params: {
        ..._req.params,
        fid,
      }
    };
    it('should be success', (done) => {
      axiosMock.onGet(`${tenant}/surveys/${id}/attachments/${fid}/download`).reply(200, {}, {
        'content-type': 'text/csv',
        'content-disposition': 'attachment'
      });
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type,
        header,
      }));
      return downloadSurveyAttachment(req, res).then(() => {
        expect(res).toHaveBeenCalledWith({});
        expect(type).toHaveBeenCalledWith('text/csv');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'attachment');
        return done();
      })
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${tenant}/surveys/${id}/attachments/${fid}/download`, downloadSurveyAttachment, false, req);
    });
  });

  describe('deleteSurveyAttachment', () => {
    const fid = '123';
    const req = {
      ..._req,
      params: {
        ..._req.params,
        fid,
      }
    };
    it('should be success', () => {
      return testForSimpleHandlers('DELETE', `${tenant}/surveys/${id}/attachments/${fid}`, deleteSurveyAttachment, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('DELETE', `${tenant}/surveys/${id}/attachments/${fid}`, deleteSurveyAttachment, false, req);
    });
  });

  describe('createSurveyPanel', () => {
    it('should be success', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${ id }/panel`, createSurveyPanel, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('POST', `/${tenant}/surveys/${ id }/panel`, createSurveyPanel, false);
    });
  });

  describe('getSurveyPanel', () => {
    it('should be success', () => {
      return testForSimpleHandlers('GET', `/${tenant}/surveys/${ id }/panel`, getSurveyPanel, true);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `/${tenant}/surveys/${ id }/panel`, getSurveyPanel, false);
    });
  });

  describe('getSurveyPanelInfo', () => {
    const type = 'external'

    const req = {
      ..._req,
      params: {
        ..._req.params,
        type
      }
    };
    it('should be success', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/panel/${ type }`, getSurveyPanelInfo, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/panel/${ type }`, getSurveyPanelInfo, false, req);
    });
  });

  describe('getSurveyExport', () => {
    it('should be success', (done) => {
      axiosMock.onGet(`${ tenant }/surveys/${ id }/responses/export`).reply(200, {}, {
        'content-type': 'text/csv',
        'content-disposition': 'attachment'
      });
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type,
        header,
      }));
      return getSurveyExport(_req, res).then(() => {
        expect(res).toHaveBeenCalledWith({});
        expect(type).toHaveBeenCalledWith('text/csv');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'attachment');
        return done();
      })
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `${ tenant }/surveys/${ id }/responses/export`, getSurveyExport, false);
    });
  });

  describe('getSurveyResponses', () => {
    const rid = '1'

    const req = {
      ..._req,
      params: {
        ..._req.params,
        rid
      }
    };
    it('should be success', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/responses`, getSurveyResponses, true, _req);
    });

    it('should be success with "rid" param', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/responses/${rid}`, getSurveyResponses, true, req);
    });

    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/responses`, getSurveyResponses, false, _req);
    });
  });

  describe('getSurveyTimeline', () => {
    it('should be success', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/timeline`, getSurveyTimeline, true, _req);
    });
    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/timeline`, getSurveyTimeline, false, _req);
    });
  });

  describe('getSurveyAnalysis', () => {
    it('should be success', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/analysis`, getSurveyAnalysis, true, _req);
    });
    it('should return wrapped error when failed', () => {
      return testForSimpleHandlers('GET', `/${ tenant }/surveys/${ id }/analysis`, getSurveyAnalysis, false, _req);
    });
  });

})
