/* global describe, it, jest, expect, beforeEach */

import applySourceMapFilter from '../sourceMapFilter';

describe('applySourceMapFilter', () => {
  let req;
  let res;
  let code;
  let mockHandler;

  beforeEach(() => {
    req = jest.fn();
    res = jest.fn();
    code = jest.fn();
    mockHandler = jest.fn();
    res.mockReturnValue({ code });
  });

  describe('source map is disabled', () => {
    beforeEach(() => {
      process.env.SOURCE_MAP_ENABLED = false;
    });

    let paths = ['/index.html', 'image.png', 'index.css.gz', 'map.js'];
    paths.forEach((path) => {
      it(`should not filter non-source map (${path})`, () => {
        req.url = { path };
        applySourceMapFilter(mockHandler)(req, res);
        expect(mockHandler).toHaveBeenCalledWith(req, res);
        expect(req).toHaveBeenCalledTimes(0);
        expect(code).toHaveBeenCalledTimes(0);
      });
    });

    paths = ['sourc.css.map', 'source.js.map', 'source.css.map.gz'];
    paths.forEach((path) => {
      it(`should filter source map (${path})`, () => {
        req.url = { path };
        applySourceMapFilter(mockHandler)(req, res);
        expect(mockHandler).toHaveBeenCalledTimes(0)
        expect(res).toHaveBeenCalledTimes(1);
        expect(code).toHaveBeenCalledTimes(1);
        expect(code).toHaveBeenCalledWith(404);
      });
    });
  });

  describe('source map is enabled', () => {
    beforeEach(() => {
      process.env.SOURCE_MAP_ENABLED = true;
    });

    let paths = ['/index.html', 'image.png', 'index.css.gz', 'map.js', 'sourc.css.map', 'source.js.map', 'source.css.map.gz'];
    paths.forEach((path) => {
      it(`should not filter any (${path})`, () => {
        req.url = { path };
        applySourceMapFilter(mockHandler)(req, res);
        expect(mockHandler).toHaveBeenCalledWith(req, res);
        expect(req).toHaveBeenCalledTimes(0);
        expect(code).toHaveBeenCalledTimes(0);
      });
    });

    it('should also honer SOURCE_MAP_ENABLED="true"', () => {
      process.env.SOURCE_MAP_ENABLED = 'true';
      req.url = { path: 'source.js.map' };
      applySourceMapFilter(mockHandler)(req, res);
      expect(mockHandler).toHaveBeenCalledWith(req, res);
      expect(req).toHaveBeenCalledTimes(0);
      expect(code).toHaveBeenCalledTimes(0);
    });
  });
});

