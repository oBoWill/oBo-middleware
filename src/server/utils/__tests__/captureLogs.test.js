/* global describe, test, jest, expect */
import captureLogs from '../captureLogs';

describe('captureLogs', () => {
  test('capture debug logs', () => {
    const warn = jest.fn();
    const error = jest.fn();
    const info = jest.fn();
    const log = jest.fn();
    global.console = {
      warn,
      error,
      info,
      debug: log,
      log,
    };
    process.env.LOGGING_LEVEL = 'DEBUG';
    captureLogs();

    console.debug('error');
    expect(log).toBeCalled();
    expect(error).not.toBeCalled();
    expect(info).not.toBeCalled();
    expect(warn).not.toBeCalled();

    console.log('error');
    expect(log).toBeCalled();
    expect(error).not.toBeCalled();
    expect(info).not.toBeCalled();
    expect(warn).not.toBeCalled();

  });
  test('capture info logs', () => {
    const warn = jest.fn();
    const error = jest.fn();
    const info = jest.fn();
    const log = jest.fn();

    global.console = {
      warn,
      error,
      info,
      debug: log,
      log,
    };
    process.env.LOGGING_LEVEL = 'INFO';
    captureLogs();

    console.info('error');
    expect(info).toBeCalled();
    expect(log).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(warn).not.toBeCalled();


  });
  test('capture warn logs', () => {
    const warn = jest.fn();
    const error = jest.fn();
    const info = jest.fn();
    const log = jest.fn();

    global.console = {
      warn,
      error,
      info,
      debug: log,
      log,
    };
    process.env.LOGGING_LEVEL = 'WARN';
    captureLogs();

    console.warn('error');
    expect(warn).toBeCalled();
    expect(log).not.toBeCalled();
    expect(error).not.toBeCalled();
    expect(info).not.toBeCalled();

  });
  test('capture error logs', () => {
    const warn = jest.fn();
    const error = jest.fn();
    const info = jest.fn();
    const log = jest.fn();

    global.console = {
      warn,
      error,
      info,
      debug: log,
      log,
    };
    process.env.LOGGING_LEVEL = 'ERROR';
    captureLogs();

    console.error('error');
    expect(error).toBeCalled();
    expect(log).not.toBeCalled();
    expect(warn).not.toBeCalled();
    expect(info).not.toBeCalled();

  });

});
