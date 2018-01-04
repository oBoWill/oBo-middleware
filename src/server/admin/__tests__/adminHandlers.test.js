import MockAdapter from 'axios-mock-adapter';
import expectLib from 'expect';

jest.mock('jwt-decode', () => v => v);
jest.mock('../../utils/errorHandlingUtil.js', () => ({
  wrapErrorResponse: err => err.response.status + 'mock'
}));
jest.mock('../../utils/httpUtil.js', () => ({
  getAccessToken: req => req.token,
  getHttpHeaders: req => req ? { test: 'getHttpHeadersMock', token: req.token && true } : {}
}));

import {
  importService,
  getImportLog,
  dataImport,
  downloadImportFileHandler
} from '../handlers';

const mAxios = new MockAdapter(importService, { delayResponse: 10 });

afterAll(() => {
  jest.unmock('jwt-decode');
  jest.unmock('../../utils/errorHandlingUtil.js');
  jest.unmock('../../utils/httpUtil.js');
  mAxios.restore();
});

afterEach(() => {
  mAxios.reset();
});

describe('admin handlers', () => {
  describe('getImportLog', () => {
    it('it should get import, and respond with it', () => {
      const req = {
        params: {
          tenant: 'tenant_mock'
        }
      };
      const res = jest.fn();
      const data = { test: 'data' };
      mAxios.onGet('/tenants/tenant_mock/admin/import').reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        return [200, data];
      });
      return getImportLog(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend error', () => {
      const req = {
        params: {
          tenant: 'tenant_mock'
        }
      };
      const res = jest.fn();
      const err = { test: 'error' };
      mAxios.onGet('/tenants/tenant_mock/admin/import').reply(418, err);
      return getImportLog(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(err);
      });
    });
  });

  describe('dataImport', () => {
    it('should send request for data import, and respond with received data', () => {
      const req = {
        params: {
          tenant: 'tenant_mock'
        },
        payload: {
          test: 'import data'
        }
      };
      const res = jest.fn();
      const data = { test: 'data' };
      mAxios.onPost('/tenants/tenant_mock/admin/import').reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        if(config.data !== JSON.stringify(req.payload)) {
          return [403, 'error'];
        }
        return [200, data];
      });
      return dataImport(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend error', () => {
      const req = {
        params: {
          tenant: 'tenant_mock'
        },
        payload: {
          test: 'import data'
        }
      };
      const res = jest.fn();
      const err = { test: 'error' };
      mAxios.onPost('/tenants/tenant_mock/admin/import').reply(418, err);
      return dataImport(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('downloadImportFileHandler', () => {
    it('should download files and respond with it', () => {
      const req = {
        params: { id: 'id_mock' },
        token: {
          tun: 'tun_mock'
        }
      };
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type,
        header
      }));
      const data = { test: 'data' };
      mAxios.onGet('/tenants/tun_mock/admin/import/id_mock/download').reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        if(!config.headers.token) {
          return [401, 'error'];
        }
        return [
          200,
          data,
          {
            'content-type': 'content-type-mock',
            'content-disposition': 'content-disposition-mock'
          }
        ];
      });
      return downloadImportFileHandler(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
        expect(type).toHaveBeenCalledWith('content-type-mock');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'content-disposition-mock');
      });
    });
  });

  it('should handle backend error', () => {
    const req = {
      params: { id: 'id_mock' },
      token: {
        tun: 'tun_mock'
      }
    };
    const res = jest.fn();
    const err = { test: 'error' };
    mAxios.onGet('/tenants/tun_mock/admin/import/id_mock/download').reply(418, err);
    return downloadImportFileHandler(req, res).then(() => {
      expect(res).toHaveBeenCalledWith('418mock');
    });
  });
});