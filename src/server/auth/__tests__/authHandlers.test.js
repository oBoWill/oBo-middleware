import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import expectLib from 'expect';
import * as httpUtil from '../../utils/httpUtil.js';
import * as errorHandlingUtil from '../../utils/errorHandlingUtil.js';
import Boom from 'boom';
import {getStaticResourcePermissions} from "../handlers";

jest.mock('jwt-decode', () => v => v);
jest.mock('../../view/HTML.js', () => (props, title) => JSON.stringify({ props, title }));
jest.mock('../../schema/schemas.js', () => ({ schemas : { schemas: 'mock' } }));

const {
  authService,
  validateAuthRedirect,
  validateCookieAuth,
  getUserPermissions,
  signin,
  signupConfirm,
  signup,
  forgotPassword,
  resetPassword,
  terms,
  createUserConfirm,
  changePassword,
  signout
} = require('../handlers');

const mAxios = new MockAdapter(authService, { delayResponse: 10 });

afterAll(() => {
  jest.unmock('jwt-decode');
  jest.unmock('../../view/HTML.js');
  jest.unmock('../../schema/schemas.js');
  mAxios.restore();
});

afterEach(() => {
  mAxios.reset();
});

const {
  COOKIE_NAME, COOKIE_PASSWORD,
  SERVICE_PROTOCOL, AUTH_SERVICE_BASE,
} = process.env;

const AUTH_SERVICE_BASE_URL = `${ AUTH_SERVICE_BASE }`;
// login endpoint
const SIGNIN_ENDPOINT = '/auth/login';
// refresh token endpoint, refresh token is provided within the header Authorization
const REFRESH_ENDPOINT = '/auth/token';
// forget password end point
const FORGOT_PASSWORD_ENDPOINT = '/auth/forgotPassword';
// reset password end point
const RESET_PASSWORD_ENDPOINT = '/auth/forgotPassword/resetPassword';

// change password end point
const CHANGE_PASSWORD_ENDPOINT = '/password';
// signup end point
const SIGNUP_ENDPOINT = '/signup';
const SIGNUP_CONFIRM_ENDPOINT = '/signup/confirm';
const TERMS_ENDPOINT = '/auth/terms';


describe('auth handlers', () => {
  describe('validateAuthRedirect', () => {
    it('should generate empty redirect url req.url.path is empty ', () => {
      const req = { url: { path: '' } };
      expect(validateAuthRedirect(req)).toBe('/signin');
      req.url.path = '/';
      expect(validateAuthRedirect(req)).toBe('/signin');
    });

    it('should generate correct signin url if req.url.path isn\'t empty', () => {
      const req = { url: { path: '/it/is/test/url' } };
      expect(validateAuthRedirect(req)).toBe('/signin?redirect=/it/is/test/url');
    });
  });

  describe('validateCookieAuth', () => {
    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getRequestFullURL').andReturn('getRequestFullURLMock');
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should call callback with error if request is not GET and x-requested-with is not XMLHttpRequest', () => {
      const req = {
        headers: { 'x-requested-with': '' },
        method: 'post'
      };
      const spy = jest.fn();
      validateCookieAuth(req, {}, spy);
      expect(spy).toHaveBeenCalledWith('CSRF Header is missing or invalid', false, null);
    });

    it('should unset cookie if refresh token is expired', () => {
      const unstate = jest.fn();
      const req = {
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        method: 'get',
        cookieAuth: { reply: { unstate } },
      };
      const session = {
        token: '',
        refreshToken: { exp: 1 }
      };
      const callback = jest.fn();
      validateCookieAuth(req, session, callback);
      expect(unstate).toHaveBeenCalledWith(COOKIE_NAME);
      expect(callback).toHaveBeenCalledWith(null, false, null);
    });

    it('should refresh access token if it\'s expired', () => {
      const state = jest.fn();
      const req = {
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        method: 'get',
        cookieAuth: { reply: { state } },
      };
      const session = {
        token: { exp: 1 },
        refreshToken: {
          exp: (Date.now() / 1000) + 10000,
          toString: function(){ return 'refreshTokenMock' }
        }
      };
      const callback = jest.fn();
      mAxios.onPost(REFRESH_ENDPOINT).reply(config => {
        if(config.headers.Authorization !== 'Bearer refreshTokenMock') {
          return [403, 'error'];
        }
        return [200, { token: 'newTockenMock' }];
      });
      return validateCookieAuth(req, session, callback).then(() => {
        expect(state.mock.calls.length).toBe(1);
        let args = state.mock.calls[0];
        expect(args[0]).toBe(COOKIE_NAME);
        expect(args[1].token).toBe('newTockenMock');
        expect(args[1].refreshToken + '').toBe('refreshTokenMock');
        args = callback.mock.calls[0];
        expect(args[0]).toBe(null);
        expect(args[1]).toBe(true);
        expect(args[2].token).toBe('newTockenMock');
        expect(args[2].refreshToken + '').toBe('refreshTokenMock');
      });
    });

    it('should handle token refresh fail', () => {
      const req = {
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        method: 'get',
        cookieAuth: { reply: { } },
      };
      const session = {
        token: { exp: 1 },
        refreshToken: {
          exp: (Date.now() / 1000) + 10000
        }
      };
      const callback = jest.fn();
      mAxios.onPost(REFRESH_ENDPOINT).reply(500);
      return validateCookieAuth(req, session, callback).then(() => {
        expect(callback).toHaveBeenCalled();
        const args = callback.mock.calls[0];
        expect(typeof args[0]).toBe('string');
        expect(args[1]).toBe(false);
        expect(args[2]).toBe(null);
      });
    });

    it('should call callback if tokens are not expired', () => {
      const req = {
        headers: { 'x-requested-with': 'XMLHttpRequest' },
        method: 'get',
        cookieAuth: { reply: { } },
      };
      const session = {
        token: { exp: (Date.now() / 1000) + 10000 },
        refreshToken: { exp: (Date.now() / 1000) + 10000 }
      };
      const callback = jest.fn();
      validateCookieAuth(req, session, callback);
      expect(callback).toHaveBeenCalledWith(null, true, null);
    });
  });

  describe('getUserPermissions', () => {
    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getAccessToken').andCall(req => req.token);
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall(req => req.token ? { test: 'getHttpHeadersMock' } : {});
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status);
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should get user permissions', () => {
      const req = {
        token: {
          tun: 'tunMock',
          uid: 'uidMock'
        }
      };

      const path = `/tenants/${req.token.tun}/permissions/userPermissions/${req.token.uid}`
      mAxios.onGet(path).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        return [200, { user: ['permissions'] }];
      });
      const callback = jest.fn();
      return getUserPermissions(req, callback).then(() => {
        expect(callback).toHaveBeenCalledWith(null, { user: ['permissions'] });
      });
    });

    it('should handle backend error', () => {
      const req = {
        token: {
          tun: 'tunMock',
          uid: 'uidMock'
        }
      };
      const path = `/tenants/${req.token.tun}/permissions/userPermissions/${req.token.uid}`
      mAxios.onGet(path).reply(418);
      const callback = jest.fn();
      return getUserPermissions(req, callback).then(() => {
        expect(callback).toHaveBeenCalledWith('Failed to get user permissions', 418);
      });
    });
  });

  describe('signin', () => {

    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req, include_token) => req && !include_token ? { test: 'getHttpHeadersMock' } : {});
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status);
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should redirect to / if user is logged in', () => {
      const req = {
        state: { [COOKIE_NAME]: 'cookie_mock' },
      };
      const res = { redirect: jest.fn() };
      signin(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('should respond with cookie if user is logged and request is post', () => {
      const req = {
        state: { [COOKIE_NAME]: 'cookie_mock' },
        method: 'post'
      };
      const res = jest.fn();
      signin(req, res);
      expect(res).toHaveBeenCalledWith('cookie_mock');
    });

    it('should respond with html containing schemas and title if user is not logged and method is get', () => {
      const req = {
        state: { },
        method: 'get'
      };
      const res = jest.fn();
      mAxios.onGet('/tenants/root/permissions').reply(() => {
        return {
          data: {
            content: [],
          },
        };
      });
      signin(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(JSON.stringify({props: {schemas: 'mock'}, title: 'APM'}));
      });
    });

    it('should get tokens from backend and save it to cookie', () => {
      const req = {
        state: { },
        method: 'post',
        payload: 'test_payload'
      };
      const state = jest.fn();
      const res = jest.fn(() => ({ state }));
      const data = { token: 'tokenMock', refreshToken: 'refreshTokenMock' };
      mAxios.onPost(SIGNIN_ENDPOINT).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        if(config.data !== 'test_payload') {
          return [418, 'error'];
        }
        return [200, data];
      });
      return signin(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
        expect(state).toHaveBeenCalledWith(COOKIE_NAME, data);
      });
    });

    it('should respond with 401 if backend response contains resetPasswordToken and status is 401', () => {
      const req = {
        state: { },
        method: 'post'
      };
      const code = jest.fn();
      const res = jest.fn(() => ({ code }));
      const data = { resetPasswordToken: 'resetPasswordTokenMock' };
      mAxios.onPost(SIGNIN_ENDPOINT).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        if(config.data !== 'test_payload') {
          return [418, 'error'];
        }
        return [401, data];
      });
      return signin(req, res, 'test_payload').then(() => {
        expect(res).toHaveBeenCalledWith(data);
        expect(code).toHaveBeenCalledWith(401);
      });
    });

    it('should handle backend error', () => {
      const req = {
        state: { },
        method: 'post'
      };
      const res = jest.fn();
      mAxios.onPost(SIGNIN_ENDPOINT).reply(418);
      return signin(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(418);
      });
    });
  });

  describe('signupConfirm', () => {
    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getRequestFullURL').andReturn('getRequestFullURLMock');
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should respond with formatted error if token is missing', () => {
      const req = {
        query: { }
      };
      const res = jest.fn();
      signupConfirm(req, res);
      expect(res).toHaveBeenCalledWith(Boom.badData('Signup confirm token is required.'));
    });

    it('should check signup and respond with html if check is successful', () => {
      const req = {
        query: { token: 'tokenMock' }
      };
      const res = jest.fn();
      mAxios.onGet(SIGNUP_CONFIRM_ENDPOINT + `?token=${req.query.token}`).reply(200);
      return signupConfirm(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(JSON.stringify({ props: { schemas: 'mock' }, title: 'APM' }));
      });
    });

    it('should check backend failure', () => {
      const req = {
        query: { token: 'tokenMock' }
      };
      const res = jest.fn();
      mAxios.onGet(SIGNUP_CONFIRM_ENDPOINT + `?token=${req.query.token}`).reply(418);
      return signupConfirm(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('signup', () => {
    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req, include_token) => req && !include_token ? { test: 'getHttpHeadersMock' } : {});
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should redirect to / if user is logged in', () => {
      const req = {
        state: { [COOKIE_NAME]: 'cookie_mock' }
      };
      const res = { redirect: jest.fn() };
      signup(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    it('should respond with html if request is get and user is not logged in', () => {
      const req = {
        state: {},
        method: 'get'
      };
      const res = jest.fn();
      mAxios.onGet('/tenants/root/permissions').reply(() => {
        return {
          data: {
            content: [],
          },
        };
      });
      signup(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(JSON.stringify({props: {schemas: 'mock'}, title: 'APM'}));
      });
    });

    it('should make request to backend sign up api and respond with received data', () => {
      const req = {
        state: {},
        method: 'post',
        payload: 'test_payload'
      };
      const res = jest.fn();
      const data = { test: 'data' };
      mAxios.onPost(SIGNUP_ENDPOINT).reply(config => {
        if(config.data !== 'test_payload') {
          return [418, 'error'];
        }
        return [200, data];
      });
      return signup(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend failure', () => {
      const req = {
        state: {},
        method: 'post',
        payload: 'test_payload'
      };
      const res = jest.fn();
      mAxios.onPost(SIGNUP_ENDPOINT).reply(418);
      return signup(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('forgotPassword', () => {
    beforeAll(() => {
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req, include_token) => req && !include_token ? { test: 'getHttpHeadersMock' } : {});
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should respond with html if request is get', () => {
      const req = {
        method: 'get'
      };
      const res = jest.fn();
      forgotPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(JSON.stringify({props: {schemas: 'mock'}, title: 'APM'}));
      });
    });

    it('should respond with formatted error if no email passed', () => {
      const req = {
        method: 'post',
        payload: {}
      };
      const res = jest.fn();
      forgotPassword(req, res);
      expect(res).toHaveBeenCalledWith(Boom.badData('Email address is required.'));
    });

    it('should call backend api and respond with received data', () => {
      const req = {
        method: 'post',
        payload: { email: 'mock@email.test' }
      };
      const res = jest.fn();
      const data = { test: 'data' };
      mAxios.onPost(FORGOT_PASSWORD_ENDPOINT).reply(config => {
        if(config.data !== JSON.stringify({ email: 'mock@email.test' })) {
          return [418, 'error'];
        }
        return [200, data];
      });
      return forgotPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend failure', () => {
      const req = {
        method: 'post',
        payload: { email: 'mock@email.test' }
      };
      const res = jest.fn();
      mAxios.onPost(FORGOT_PASSWORD_ENDPOINT).reply(418);
      return forgotPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('resetPassword', () => {
    beforeAll(() => {
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req, include_token) => req && !include_token ? { test: 'getHttpHeadersMock' } : {});
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should respond with html if request is get', () => {
      const req = {
        method: 'get'
      };
      const res = jest.fn();
      resetPassword(req, res);
      expect(res).toHaveBeenCalledWith(JSON.stringify({ props: { schemas: 'mock' }, title: 'APM' }));
    });

    it('should respond with formatted error if no newPassword passed', () => {
      const req = {
        method: 'post',
        payload: {}
      };
      const res = jest.fn();
      resetPassword(req, res);
      expect(res).toHaveBeenCalledWith(Boom.badData('New password is required.'));
    });

    it('should call backend api and respond with received data', () => {
      const req = {
        method: 'post',
        payload: {
          newPassword: 'passwordMock',
          token: 'tokenMock'
        }
      };
      const data = { test: 'data' };
      mAxios.onPost(RESET_PASSWORD_ENDPOINT + `/${req.payload.token}`).reply(config => {
        if(config.data !== JSON.stringify({ password: req.payload.newPassword })) {
          return [418, 'error'];
        }
        return [200, data];
      });
      const res = jest.fn();
      return resetPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should call backend api and if token cpr === 1 sign user in', () => {
      const req = {
        method: 'post',
        state: { },
        payload: {
          newPassword: 'passwordMock',
          token: {
            cpr: 1,
            sub: 'email@mock.test',
            toString: () => 'tokenMock'
          }
        }
      };
      const data = { test: 'data' };
      mAxios.onPost(RESET_PASSWORD_ENDPOINT + `/${req.payload.token}`).reply(config => {
        if(config.data !== JSON.stringify({ password: req.payload.newPassword })) {
          return [418, 'error'];
        }
        return [200, {}];
      });
      mAxios.onPost(SIGNIN_ENDPOINT).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [403, 'error'];
        }
        if(config.data !== JSON.stringify({ email: req.payload.token.sub, password: req.payload.newPassword })) {
          return [401, 'error'];
        }
        return [200, data];
      });
      const res = jest.fn();
      return resetPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend failure', () => {
      const req = {
        method: 'post',
        state: { },
        payload: {
          newPassword: 'passwordMock',
          token: {
            cpr: 1,
            sub: 'email@mock.test',
            toString: () => 'tokenMock'
          }
        }
      };
      const res = jest.fn();
      mAxios.onPost(RESET_PASSWORD_ENDPOINT + `/${req.payload.token}`).reply(418);
      return resetPassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('terms', () => {
    beforeAll(() => {
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req, include_token, headers, accept) => {
        if(req && !include_token && headers.length === 0 && accept === null) {
          return { test: 'getHttpHeadersMock' };
        }
        return {};
      });
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should get data from backend and respond with it', () => {
      const req = {};
      const res = jest.fn(() => ({
        type: () => {},
        header: () => {}
      }));
      const data = { test: 'data' };
      mAxios.onGet(TERMS_ENDPOINT).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        return [200, data, {}];
      });
      return terms(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should set type and header', () => {
      const req = {};
      const type = jest.fn();
      const header = jest.fn();
      const res = jest.fn(() => ({
        type,
        header
      }));
      mAxios.onGet(TERMS_ENDPOINT).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        return [
          200,
          {},
          {
            'content-type': 'content-type-mock',
            'content-disposition': 'content-disposition-mock'
          }
        ];
      });
      return terms(req, res).then(() => {
        expect(type).toHaveBeenCalledWith('content-type-mock');
        expect(header).toHaveBeenCalledWith('Content-Disposition', 'content-disposition-mock');
      });
    });

    it('should handle backend failure', () => {
      const req = {
        method: 'post',
        payload: { email: 'mock@email.test' }
      };
      const res = jest.fn();
      mAxios.onGet(TERMS_ENDPOINT).reply(418);
      return terms(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('createUserConfirm', () => {
    beforeAll(() => {
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should call backend api and respond with html', () => {
      const req = {
        query: {
          token: {
            uid: 'uid_mock',
            tun: 'tun_mock',
            toString: () => 'token_mock'
          }
        }
      };
      const res = jest.fn();
      mAxios.onGet('/tenants/tun_mock/users/uid_mock/confirm?token=token_mock').reply(200);
      return createUserConfirm(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(JSON.stringify({ props: { schemas: 'mock' }, title: 'APM' }));
      });
    });

    it('should handle backend failure', () => {
      const req = {
        query: {
          token: {
            uid: 'uid_mock',
            tun: 'tun_mock',
            toString: () => 'token_mock'
          }
        }
      };
      const res = jest.fn();
      mAxios.onGet('/tenants/tun_mock/users/uid_mock/confirm?token=token_mock').reply(418);
      return createUserConfirm(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('changePassword', () => {
    beforeAll(() => {
      expectLib.spyOn(errorHandlingUtil, 'wrapErrorResponse').andCall(err => err.response.status + 'mock');
      expectLib.spyOn(httpUtil, 'getHttpHeaders').andCall((req) => req ? { test: 'getHttpHeadersMock' } : {});

    });

    afterAll(() => {
      expectLib.restoreSpies();
    });

    it('should call backend api and respond with received data', () => {
      const req = {
        payload: {
          tenant: 'tenant_mock',
          id: 'id_mock',
          newPassword: 'newPasswordMock',
          oldPassword: 'oldPasswordMock'
        }
      };
      const res = jest.fn();
      const data = { test: 'data' };
      mAxios.onPost(`/tenants/${req.payload.tenant}/users/${req.payload.id}/${CHANGE_PASSWORD_ENDPOINT}`).reply(config => {
        if(config.headers.test !== 'getHttpHeadersMock') {
          return [418, 'error'];
        }
        if(config.data !== JSON.stringify({ newPassword: req.payload.newPassword, oldPassword: req.payload.oldPassword })) {
          return [403, 'error'];
        }
        return [200, data];
      });
      return changePassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith(data);
      });
    });

    it('should handle backend failure', () => {
      const req = {
        payload: {
          tenant: 'tenant_mock',
          id: 'id_mock',
          newPassword: 'newPasswordMock',
          oldPassword: 'oldPasswordMock'
        }
      };
      const res = jest.fn();
      mAxios.onPost(`/tenants/${req.payload.tenant}/users/${req.payload.id}/${CHANGE_PASSWORD_ENDPOINT}`).reply(418)
      return changePassword(req, res).then(() => {
        expect(res).toHaveBeenCalledWith('418mock');
      });
    });
  });

  describe('signout', () => {
    it('should respond with 200 and remove cookie', () => {
      const req = {};
      const unstate = jest.fn();
      const res = jest.fn(() => ({ unstate }));
      signout(req, res);
      expect(res).toHaveBeenCalledWith(200);
      expect(unstate).toHaveBeenCalledWith(COOKIE_NAME);
    });
  });
});