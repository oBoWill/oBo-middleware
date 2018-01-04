import expect from 'expect';
import axios from 'axios';
import b64 from 'b64';
import Boom from 'boom';
import MockAdapter from 'axios-mock-adapter';
import Hapi from 'hapi';
import request from 'supertest';

import * as reCaptchaValidation from '../reCaptchaValidation';
import sh, { generateCookie, encodeCookie, decodeCookie, fetchSurvey, surveyHostingService, startSurvey, errors as surveyErrors } from '../surveyHostingHandlers';

const date = new Date();
const server = new Hapi.Server();
server.connection({
  port: 8080,
  host: 'localhost'
});
server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});
server.register(sh('/sh'));

const {
  SERVICE_PROTOCOL,
  SH_SERVICE_BASE, SH_COOKIE_NAME,
  RECAPTCHA_VERIFICATION, RECAPTCHA_SITEKEY,
} = process.env;

const axiosMock = new MockAdapter(surveyHostingService);
jest.mock('../surveyEngine', () => (props = {}, title) => `${JSON.stringify({...props, title})}`);
jest.mock('../surveyHostingError', () => (props = {}, title) => `${JSON.stringify({...props, title})}`);
const spyOnVlaidateHMAC = expect.spyOn(reCaptchaValidation, 'validateHMAC')
  .andCall(() => true);
const spyOnCreateHMAC = expect.spyOn(reCaptchaValidation, 'createHMAC')
  .andCall(() => 'hmac');
const spyOnCaptcha = expect.spyOn(reCaptchaValidation, 'validateReCaptcha')
  .andCall((captcha) => new Promise((resolve) => {
    return resolve({
      data: {
        challenge_ts: captcha && captcha.date ? new Date('01/01/2017') : date.getTime(),
        success: captcha && captcha.robot ? false : true,
      }
    })
  }));
const consoleMock = expect.spyOn(console, 'log');

beforeAll((done) => {
  server.start(() => {
    done();
  })
});
afterAll((done) => {
  jest.unmock('../surveyEngine');
  jest.unmock('../surveyHostingError');
  axiosMock.restore();
  spyOnVlaidateHMAC.restore();
  consoleMock.restore();
  spyOnCaptcha.restore();
  spyOnCreateHMAC.restore();
  server.stop(() => {
    done();
  })
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

const _req = {
  info: {
    referer: 'referer',
    remoteAddress: 'localhost',
  },
  headers: {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.91 Safari/537.36',
  }
};
const mockRes = (params) => ({state: () => ({state: () => params})});
const expectedResult = `${JSON.stringify({..._props, title: fetchRes.sections[0].label})}`;
const expectedResultFail = `${JSON.stringify({...surveyErrors.notFound(), title: surveyErrors.notFound().errorTitle})}`;

describe('surveyHostingHandlers', () => {
  const cookies = generateCookie({pid: '20003'});

  describe('utils', () => {
    const encodedCookie = b64.encode(new Buffer(JSON.stringify(cookies))).toString();

    it('encodeCookies', () => {
      expect(encodeCookie(cookies)).toBe(encodedCookie);
    });
    it('decodeCookies', () => {
      expect(decodeCookie(encodedCookie)).toEqual(cookies);
    });
  });

  describe('handlers', () => {


    it('fetchSurvey success', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);

      fetchSurvey(mockRes, '20003', cookies).then((r) => {
        expect(r).toBe(expectedResult);
        done();
      });
    })

    it('fetchSurvey fail', (done) => {
      axiosMock.onGet(`20003`).reply(404, { error: { message: 'error'} });

      fetchSurvey((p) => p, '20003', cookies).then((r) => {
        expect(r).toBe(expectedResultFail);
        done();
      });
    })

    it('startSurvey success', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      axiosMock.onPost(`20003/activities`).reply(200, {});

      startSurvey(_req, mockRes, cookies, date.getTime()).then((r) => {
        expect(r).toBe(expectedResult);
        done();
      });
    })

    it('startSurvey fail', (done) => {
      axiosMock.onGet(`20003`).reply(404, { error: { message: 'error'} });
      axiosMock.onPost(`20003/activities`).reply(404, { error: { message: 'error'} });

      startSurvey(_req, (p) => p, cookies, date.getTime()).then((r) => {
        expect(r).toBe(expectedResultFail);
        done();
      });
    })
  });

  describe('routes', () => {

    it('should return index page', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).get('/sh?pid=20003').set('Host', 'localhost:8080').expect(200, function(err, resp) {
        expect(resp.text).toBe(expectedResult);
        done();
      });
    });

    it('should return error when no pid on params and on cookies', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).get('/sh').set('Host', 'localhost:8080').expect(404, function(err, resp) {
        expect(resp.text).toBe(expectedResultFail);
        done();
      });
    });

    it('should return error when invalid host', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).get('/sh').set('Host', 'example.com').expect(404, function(err, resp) {
        expect(resp.text).toBe(expectedResultFail);
        done();
      });
    });

    it('should return index page id from cookie', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).get('/sh')
        .set('Host', 'localhost:8080')
        .set('Cookie', [`${SH_COOKIE_NAME}=20003`])
        .expect(200, function(err, resp) {
          expect(resp.text).toBe(expectedResult);
          done();
        });
    });

    it('should return preview page', (done) => {
      const expectedResultPreview = `${JSON.stringify({..._props, previewMode: true, title: fetchRes.sections[0].label})}`;
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).get('/sh/preview?pid=20003').set('Host', 'localhost:8080').expect(200, function(err, resp) {
        expect(resp.text).toBe(expectedResultPreview);
        done();
      });
    });

    it('should return preview fail page', (done) => {
      axiosMock.onGet(`20003`).reply(404, { error: { message: 'error'} });
      request(server.listener).get('/sh/preview?pid=20003').set('Host', 'localhost:8080').expect(200, function(err, resp) {
        expect(resp.text).toBe(expectedResultFail);
        done();
      });
    });

    it('should return error page', (done) => {
      const expectedErrorPage = `${JSON.stringify({
        errorTitle: 'We have encountered an error',
        errorMessage: '',
        errorResolution: 'Please contact support@agilepm.cloud and provide the error code. We apologize for any inconvenience.<br/><br/>AgilePM Team',
        title: 'We have encountered an error'
      })}`;
      request(server.listener).get('/sh/error').expect(200, function(err, resp) {
        expect(resp.text).toBe(expectedErrorPage);
        done();
      });
    });

    it('should return save survey response', (done) => {
      axiosMock.onPost(`20003/activities`).reply(200, {message: 'ok'});
      request(server.listener).post('/sh/20003/save')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie(cookies)}`])
        .expect(200, function(err, resp) {
          // console.log(resp.text);
          expect(JSON.parse(resp.text)).toEqual({message: 'ok'});
          done();
        });
    });

    it('save survey should fail without X-Requested-With header', (done) => {
      request(server.listener).post('/sh/20003/save')
        .send({})
        .set('Host', 'localhost:8080')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie(cookies)}`])
        .expect(401, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.unauthorized('CSRF Header is missing or invalid').output.payload);
          done();
        });
    });

    it('save survey should fail without session cookie', (done) => {
      request(server.listener).post('/sh/20003/save')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .expect(401, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.unauthorized().output.payload);
          done();
        });
    });

    it('save survey should fail on API error', (done) => {
      axiosMock.onPost(`20003/activities`).reply(400, {error: {message: 'Error'}});
      request(server.listener).post('/sh/20003/save')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie(cookies)}`])
        .expect(400, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.badRequest('Error').output.payload);
          done();
        });
    });

    it('should submit survey', (done) => {
      axiosMock.onPost(`20003/activities`).reply(200, {message: 'ok'});
      request(server.listener).post('/sh/20003/submit')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie(cookies)}`])
        .expect(200, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual({message: 'ok'});
          done();
        });
    });

    it('submit survey should fail without X-Requested-With header', (done) => {
      request(server.listener).post('/sh/20003/submit')
        .send({})
        .set('Host', 'localhost:8080')
        .expect(401, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.unauthorized('CSRF Header is missing or invalid').output.payload);
          done();
        });
    });

    it('submit survey should fail without cookies', (done) => {
      request(server.listener).post('/sh/20003/submit')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies, pid: 123})}`])
        .expect(401, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.unauthorized().output.payload);
          done();
        });
    });

    it('submit survey should fail without cookies', (done) => {
      request(server.listener).post('/sh/20003/submit')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies, timestamp: +new Date('01/01/2017')})}`])
        .expect(401, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.unauthorized().output.payload);
          done();
        });
    });


    it('submit survey should fail on API error', (done) => {
      axiosMock.onPost(`20003/activities`).reply(400, {error: {message: 'Error'}});
      request(server.listener).post('/sh/20003/submit')
        .send({})
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', [`${SH_COOKIE_NAME}_20003=${encodeCookie(cookies)}`])
        .expect(400, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual(Boom.badRequest('Error').output.payload);
          done();
        });
    });


    it('should fetch started survey after turing test', (done) => {
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).post('/sh')
        .send({
          pid: '20003',
          'g-recaptcha-response': {},
          cjfp: true,
          cjd: '{}'
        })
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', `${SH_COOKIE_NAME}=20003; ${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies, started: true})}`)
        .expect(200, function(err, resp) {
          expect(resp.text).toBe(expectedResult);
          done();
        });
    });

    it('should start survey after turing test', (done) => {
      axiosMock.onPost(`20003/activities`).reply(200);
      axiosMock.onGet(`20003`).reply(200, fetchRes);
      request(server.listener).post('/sh')
        .send({
          pid: '20003',
          'g-recaptcha-response': {},
          cjfp: true,
          cjd: '{}'
        })
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', `${SH_COOKIE_NAME}=20003; ${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies})}`)
        .expect(200, function(err, resp) {
          expect(resp.text).toBe(expectedResult);
          done();
        });
    });


    it('should fail turing test if survey already submitted', (done) => {
      const error = surveyErrors.alreadyCompleted();
      request(server.listener).post('/sh')
        .send({
          pid: '20003',
          'g-recaptcha-response': {},
          cjfp: true,
          cjd: '{}'
        })
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', `${SH_COOKIE_NAME}=20003; ${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies, submitted: true})}`)
        .expect(200, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual({...error, title: error.errorTitle});
          done();
        });
    });

    it('should fail turing test if survey already submitted', (done) => {
      const error = surveyErrors.generalError('T800', 'Unexpected Error');
      request(server.listener).post('/sh')
        .send({
          pid: '20003',
          'g-recaptcha-response': {robot: true},
          cjfp: true,
          cjd: '{}'
        })
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', `${SH_COOKIE_NAME}=20003; ${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies})}`)
        .expect(200, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual({...error, title: error.errorTitle});
          done();
        });
    });

    it('should fail turing test if survey already submitted', (done) => {
      const error = surveyErrors.generalError('T1000', 'Unexpected Error');
      request(server.listener).post('/sh')
        .send({
          pid: '20003',
          'g-recaptcha-response': {date: true},
          cjfp: true,
          cjd: '{}'
        })
        .set('Host', 'localhost:8080')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Cookie', `${SH_COOKIE_NAME}=20003; ${SH_COOKIE_NAME}_20003=${encodeCookie({...cookies})}`)
        .expect(200, function(err, resp) {
          expect(JSON.parse(resp.text)).toEqual({...error, title: error.errorTitle});
          done();
        });
    });

  });
});
