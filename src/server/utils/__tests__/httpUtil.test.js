/* global describe, test, jest, expect */
import { getRequestFullURL, getAccessToken, getRefreshToken, getHttpHeaders } from '../httpUtil';

const {
  COOKIE_NAME,
} = process.env;

describe('httpUtil', () => {
  const protocol = 'http';
  const host = 'test.test';
  const path = '/test/path';
  const requestBase = {
    connection: {
      info: {
        protocol,
      },
    },
    info: {
      host,
    },
    url: {
      path,
    },
  };

  describe('getRequestFullURL', () => {
    it('should return url from request', () => {
      let url = getRequestFullURL(requestBase);
      let fullUrl = `${protocol}://${host}${path}`;
      expect(url).toBe(fullUrl);
    });
  });

  describe('getAccessToken', () => {
    it('should return authToken from request.auth.credetials', () => {
      const requestToken = 'test_token';
      let request = {
        ...requestBase,
        auth: {
          credentials: {
            token: requestToken,
          },
        },
        state: {}
      };
      expect(getAccessToken(request)).toBe(requestToken);
    });

    it('should return authToken from cookies', () => {
      const requestToken = 'test_token';
      let request = {
        ...requestBase,
        auth: {},
        state: {
          [COOKIE_NAME]: {
            token: requestToken,
          },
        },
      };
      expect(getAccessToken(request)).toBe(requestToken);
    });

    it('should return empty result if there is no cookie and auth', () => {
      const requestToken = 'test_token';
      let request = {
        ...requestBase,
        auth: {},
        state: {},
      };
      expect(getAccessToken(request)).toBe(null);
    });
  });

  describe('getRefreshToken', () => {
    it('should return token from request.auth.credetials', () => {
      const requestToken = 'refresh_token';
      let request = {
        ...requestBase,
        auth: {
          credentials: {
            refreshToken: requestToken,
          },
        },
        state: {},
      };
      expect(getRefreshToken(request)).toBe(requestToken);
    });

    it('should return authToken from cookies', () => {
      const requestToken = 'refresh_token';
      let request = {
        ...requestBase,
        auth: {
          credentials: {
            refreshToken: requestToken,
          },
        },
        state: {
          [COOKIE_NAME]: {
            token: requestToken,
          },
        },
      };
      expect(getRefreshToken(request)).toBe(requestToken);
    });

    it('should return empty result if there is no cookie and auth', () => {
      const requestToken = 'test_token';
      let request = {
        ...requestBase,
        auth: {},
        state: {},
      };
      expect(getRefreshToken(request)).toBe(null);
    });
  });

  describe('getHttpHeaders', () => {
    const requestToken = 'refresh_token';
    let request = {
      ...requestBase,
      auth: {
        credentials: {
          token: requestToken,
        },
      },
      headers: {
        accept: 'application/json, text/plain, */*',
        host: 'localhost:3333',
        'accept-encoding': 'gzip, deflate, br',
        'x-requested-with': 'XMLHttpRequest',
        'accept-language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
        connection: 'keep-alive',
      },
    };

    it('should return result headers with token', () => {
      let resultHeadersWithToken = getHttpHeaders(request);
      expect(resultHeadersWithToken.accept).toBe('application/json');
      expect(resultHeadersWithToken.hasOwnProperty('accept-encoding')).toBe(true);
      expect(resultHeadersWithToken.hasOwnProperty('accept-language')).toBe(true);
      expect(resultHeadersWithToken.hasOwnProperty('Authorization')).toBe(true);
      expect(resultHeadersWithToken.Authorization).toBe(`Bearer ${requestToken}`);
    });
    it('should return result headers without token', () => {
      let resultHeadersWithoutToken = getHttpHeaders(request, false);
      expect(resultHeadersWithoutToken.hasOwnProperty('Authorization')).toBe(false);
    });
    it('should return result headers with additional headers', () => {
      request = {
        ...request,
        headers: {
          ...request.headers,
          'custom-header': 'header',
        }
      }
      let resultHeadersWithoutAdditionalHeaders = getHttpHeaders(request, true, ['custom-header']);
      expect(resultHeadersWithoutAdditionalHeaders.hasOwnProperty('custom-header')).toBe(true);
    });
  });
});
