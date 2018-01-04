/* global describe, it, jest, expect */

import requestLogger from '../requestLogger.js';
import Hapi from 'hapi';
import hapiTest from 'hapi-test';

const error = jest.fn();
const info = jest.fn();

global.console.info = info;
global.console.error = error;

describe('requestLogger', () => {

  let server;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection({
      port: 8888,
    });
    server.route({
      method: 'GET',
      path: '/test',
      config: {
        auth: false,
        handler: (req, res) => {res()},
      },
    });

    server.route({
      method: 'GET',
      path: '/error',
      config: {
        auth: false,
        handler: (req, res) => {throw new Error('some error')},
      },
    });

    server.register(requestLogger, done);
  });

  it('log request', (done) => {

    hapiTest({ server })
      .get('/test')
      .end(() => {
        let includesPath = info.mock.calls[0][0].includes('GET /test');

        expect(console.info).toBeCalled();
        expect(includesPath).toBe(true);

        done();
      });

  });

  it('log error request', (done) => {

    hapiTest({ server })
      .get('/404')
      .then(() => {

        let includesNotFound = error.mock.calls[0][0].includes('404 Not Found');
        expect(console.error).toBeCalled();
        expect(includesNotFound).toBe(true);

        done();
      });

  });

});
