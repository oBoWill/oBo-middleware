/* global describe, it, jest, expect */

import requireHttps from '../requireHttps';
import Hapi from 'hapi';

const error = jest.fn();
const info = jest.fn();

describe('requireHttps', () => {

  let server;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection({
      port: 8888
    });
    server.route({
      method: 'GET',
      path: '/test',
      config: {
        auth: false,
        handler: (req, res) => {res()},
      },
    });

    server.register(requireHttps, done);
  });


  it('https no-redirect', (done) => {

    let request = {
      method: 'GET',
      url: '/test',
      payload: {},
      headers: {
        'x-forwarded-proto': 'https',
        host: 'test.test'
      }
    };
    server.inject(request)
      .then(response => {
        expect(response.statusCode).toBe(200);
        done()
      });

  });

  it('http redirect', (done) => {

    let request = {
      method: 'GET',
      url: '/test',
      payload: {},
      headers: {
        'x-forwarded-proto': 'http',
        host: 'test.test'
      }
    };
    server.inject(request)
      .then(response => {
        expect(response.headers.location).toBe('https://test.test/test');
        expect(response.statusCode).toBe(301);
        done()
      });

  });

});
