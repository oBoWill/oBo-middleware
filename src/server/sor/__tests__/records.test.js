/* global describe, it, jest, expect */

import {
  recordService,
  getSORRecords,
  getSORSchema,
  saveRecord,
  exportRecords,
  deleteRecord,
  getAttachmentsHandler,
  saveAttachments,
  downloadAttachmentsHandler,
  deleteAttachmentsHandler,
  saveComments,
  updateComments,
  deleteComments,
  getCommentsHandler,
  getUserStoriesHandler,
  saveUserStoriesHandler,
} from './../records';
import Boom from 'boom';
import MockAdapter from 'axios-mock-adapter';

const axiosMock = new MockAdapter(recordService);
jest.mock('../../auth/handlers', () => ({}));
jest.mock('../../utils/httpUtil', () => {
  const token =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE1MDY2MTA1NzgsImV4cCI6MTUzODE0NjU3OCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsInR1biI6InRlc3QifQ.xdan4pTNZ0cjsZZGqdgVRqOcF3UgtR1lbB7AGt_vess';
  return {
    getAccessToken: () => token,
    getHttpHeaders: () => ({
      Authorization: token,
    }),
  };
});

jest.mock('../../security/sslUtil', () => ({}));

// beforeAll((done) => {
//   server.start(() => {
//     done();
//   })
// });
afterAll(() => {
  jest.unmock('../../auth/handlers');
  jest.unmock('../../security/sslUtil');
  jest.unmock('../../utils/httpUtil');
  axiosMock.restore();
});
afterEach(() => {
  axiosMock.reset();
});

const tenant = 'testing';
const id = '822';
const recordType = 'products';

const fetchRes = {
  id,
};

const defaultRequest = {
  info: {
    referer: 'referer',
    remoteAddress: 'localhost',
  },
  params: {
    recordType,
    tenant,
    id,
  },
  headers: {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
  },
  query: {}
};

const testHandler = ({
  method,
  url,
  handler,
  isSuccess = true,
  req = defaultRequest,
}, { res = jest.fn(), headers = {} } = {}) => {
  if(method === 'GET') {
    axiosMock.onGet(url).reply(isSuccess ? 200 : 400, fetchRes, headers);
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() =>
      expect(res).toHaveBeenCalledWith(isSuccess ? fetchRes : Boom.badRequest())
    );
  }
  if(method === 'POST') {
    axiosMock.onPost(url).reply(isSuccess ? 200 : 400, fetchRes, headers);
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() =>
      expect(res).toHaveBeenCalledWith(isSuccess ? fetchRes : Boom.badRequest())
    );
  }
  if(method === 'DELETE') {
    axiosMock.onDelete(url).reply(isSuccess ? 200 : 400, fetchRes, headers);
    expect(res).not.toHaveBeenCalled();
    return handler(req, res).then(() =>
      expect(res).toHaveBeenCalledWith(isSuccess ? fetchRes : Boom.badRequest())
    );
  }
  return Promise.reject();
};

describe('records', () => {

  describe('getSORRecords', () => {
    it('should be success', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}`,
        handler: getSORRecords,
        isSuccess: true,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}`,
        handler: getSORRecords,
        isSuccess: false,
      }));
  });

  describe('saveRecord', () => {
    const req = { ...defaultRequest, payload: { copyFrom: id } };
    it('should handle success when copyFrom exists', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}`,
        handler: saveRecord,
        isSuccess: true,
        req,
      }));

    it('should return wrapped error when failed success when copyFrom exists', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}`,
        handler: saveRecord,
        isSuccess: false,
        req
      }));

    const noCopyReq = {
      ...defaultRequest,
      params: { ...defaultRequest.params, id: undefined },
      payload: { copyFrom: undefined }
    }
    it('should handle success when copyFrom is not exists', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}`,
        handler: saveRecord,
        isSuccess: true,
        req: noCopyReq
      }));

    it('should return wrapped error when failed success when copyFrom is not exists', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}`,
        handler: saveRecord,
        isSuccess: false,
        req: noCopyReq
      }));
  });

  describe('exportRecords', () => {
    it('should be success', () => {
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type, header
      }));
      const headers = {
        'content-type': 'test-content-type',
        'content-disposition': 'test-content-disposition'
      };
      return testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/export`,
        handler: exportRecords,
        isSuccess: true,
      }, {res, headers}).then((arg) => {
        expect(type).toHaveBeenCalledWith('test-content-type');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'test-content-disposition');
      });
    });

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/export`,
        handler: exportRecords,
        isSuccess: false,
      }));
  });

  describe('deleteRecord', () => {
    it('should be success', () =>
      testHandler({
        method: 'DELETE',
        url: `${tenant}/${recordType}/${id}`,
        handler: deleteRecord,
        isSuccess: true,
        req: { ...defaultRequest, payload: { copyFrom: id } },
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'DELETE',
        url: `${tenant}/${recordType}/${id}`,
        handler: deleteRecord,
        isSuccess: false,
        req: { ...defaultRequest, payload: { copyFrom: id } },
      }));
  });

  describe('getAttachmentsHandler', () => {
    it('should be success', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/attachments`,
        handler: getAttachmentsHandler,
        isSuccess: true,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/attachments`,
        handler: getAttachmentsHandler,
        isSuccess: false,
      }));
  });

  describe('saveAttachments', () => {
    let req = { ...defaultRequest, payload: `
      ------WebKitFormBoundarySAxfKLKjJ3MxZyDB
      Content-Disposition: form-data; name="file"; filename="Screen Shot 2017-09-06 at 2.07.07 PM.png"
      Content-Type: image/png
      ------WebKitFormBoundarySAxfKLKjJ3MxZyDB--`,
    };
    it('should be success', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}/attachments/`,
        handler: saveAttachments,
        isSuccess: true,
        req,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}/attachments/`,
        handler: saveAttachments,
        isSuccess: false,
        req,
      }));
  });

  describe('downloadAttachmentsHandler', () => {
    let fid = '123';
    let req = { ...defaultRequest, params: { ...defaultRequest.params, fid } };

    it('should be success', () => {
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type, header
      }));
      const headers = {
        'content-type': 'test-content-type',
        'content-disposition': 'test-content-disposition'
      };
      return testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/attachments/${fid}/download`,
        handler: downloadAttachmentsHandler,
        isSuccess: true,
        req
      }, { res, headers }).then(() => {
        expect(type).toHaveBeenCalledWith('test-content-type');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'test-content-disposition');
      });
    });

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/attachments/${fid}/download`,
        handler: downloadAttachmentsHandler,
        isSuccess: false,
        req,
      }));
  });

  describe('deleteAttachmentsHandler', () => {
    let fid = '123';
    let req = { ...defaultRequest, params: { ...defaultRequest.params, fid } };

    it('should be success', () =>
      testHandler({
        method: 'DELETE',
        url: `${tenant}/${recordType}/${id}/attachments/${fid}`,
        handler: deleteAttachmentsHandler,
        isSuccess: true,
        req,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'DELETE',
        url: `${tenant}/${recordType}/${id}/attachments/${fid}`,
        handler: deleteAttachmentsHandler,
        isSuccess: false,
        req,
      }));
  });

  describe('saveComments', () => {
    it('should be success', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}/comments`,
        handler: saveComments,
        isSuccess: true
      }));

    it('should be success with replyTo', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}/comments?replyTo=123`,
        handler: saveComments,
        isSuccess: true,
        req: {...defaultRequest, query: { replyTo: '123' }}
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/${recordType}/${id}/comments`,
        handler: saveComments,
        isSuccess: false
      }));
  });

  describe('updateComments', () => {
    let cid = '123';
    let req = { ...defaultRequest, params: { ...defaultRequest.params, cid }, payload: {} };

    it('should be success', () =>
      testHandler({
        method: 'POST',
        url: `/${tenant}/${recordType}/${id}/comments/${cid}`,
        handler: updateComments,
        isSuccess: true,
        req,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'POST',
        url: `/${tenant}/${recordType}/${id}/comments/${cid}`,
        handler: updateComments,
        isSuccess: false,
        req,
      }));
  });

  describe('deleteComments', () => {
    let cid = '123';
    let req = { ...defaultRequest, params: { ...defaultRequest.params, cid }, payload: {} };

    it('should be success', () =>
      testHandler({
        method: 'DELETE',
        url: `/${tenant}/${recordType}/${id}/comments/${cid}`,
        handler: deleteComments,
        isSuccess: true,
        req,
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'DELETE',
        url: `/${tenant}/${recordType}/${id}/comments/${cid}`,
        handler: deleteComments,
        isSuccess: false,
        req,
      }));
  });

  describe('getCommentsHandler', () => {
    it('should be success', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/comments`,
        handler: getCommentsHandler,
        isSuccess: true
      }));

    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/${recordType}/${id}/comments`,
        handler: getCommentsHandler,
        isSuccess: false
      }));
  });

  describe('getUserStoriesHandler', () => {
    it('should be success with id', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/userStories/${id}`,
        handler: getUserStoriesHandler,
        isSuccess: true
      }));
    it('should be success with feature id', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/userStories?feature=123`,
        handler: getUserStoriesHandler,
        isSuccess: true,
        req: { ...defaultRequest, params: { tenant }, query: { feature: '123' } }
      }));
    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'GET',
        url: `${tenant}/userStories/${id}`,
        handler: getUserStoriesHandler,
        isSuccess: false
      }));
  });

  describe('saveUserStoriesHandler', () => {
    it('should be success with id', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/userStories/${id}`,
        handler: saveUserStoriesHandler,
        isSuccess: true
      }));
    it('should be success without id', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/userStories`,
        handler: saveUserStoriesHandler,
        isSuccess: true,
        req: { ...defaultRequest, params: { tenant, fid: '123' } }
      }));
    it('should return wrapped error when failed', () =>
      testHandler({
        method: 'POST',
        url: `${tenant}/userStories/${id}`,
        handler: saveUserStoriesHandler,
        isSuccess: false
      }));
  });

  describe('getSORSchema', () => {
    it('should get schema of passed type from backend', () => {
      const callback = jest.fn();
      const data = {test : 'data'};
      axiosMock.onGet('/test/test_type/schema').reply(200, data);
      return getSORSchema({}, 'test_type', callback).then(() => {
        const args = callback.mock.calls[0];
        expect(args[0]).toBe(null);
        expect(args[1].data).toEqual(data);
      });

    });
    it('should handle backend error', () => {
      testHandler({
        method: 'GET',
        url: '/test/test_type/schema',
        handler: getSORSchema,
        isSuccess: false,
      });
    });
  });
});
