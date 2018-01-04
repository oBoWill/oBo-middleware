
jest.mock('../info', () => {
  return jest.fn();
});
let infoMock = require('../info');

import { addInternalRoutes } from '../internalRoutes';

describe('addInternalRoutes', () => {
  let server = { route: jest.fn() }

  beforeEach(() => {
    server.route.mockReset();
  });

  afterEach(() => {
    delete process.env.STORYBOOK_ENABLED;
  });

  test('add all routes with storybook enabled', () => {
    process.env.STORYBOOK_ENABLED = 'true';
    addInternalRoutes(server);

    expect(server.route.mock.calls.length).toBe(3);
    expect(server.route.mock.calls[0][0].path).toBe('/internal/health');
    expect(server.route.mock.calls[1][0].path).toBe('/internal/info');
    expect(server.route.mock.calls[2][0].path).toBe('/internal/storybook/{path*}');
  });

  test('add all route without storybook', () => {
    
    addInternalRoutes(server);
    expect(server.route.mock.calls.length).toBe(2);
    expect(server.route.mock.calls[0][0].path).toBe('/internal/health');
    expect(server.route.mock.calls[1][0].path).toBe('/internal/info');
  });

  test('health check route', () => {
    addInternalRoutes(server);
    let req = jest.fn();
    let res = jest.fn();
    expect(server.route.mock.calls[0][0].path).toBe('/internal/health');
    server.route.mock.calls[0][0].config.handler(req, res);
    expect(res.mock.calls[0][0]).toEqual({ 'status': 'UP' });
  });

  test('info route', () => {
    addInternalRoutes(server);
    expect(server.route.mock.calls[1][0].path).toBe('/internal/info');
    expect(server.route.mock.calls[1][0].config.handler).toBe(infoMock);
  });
});
