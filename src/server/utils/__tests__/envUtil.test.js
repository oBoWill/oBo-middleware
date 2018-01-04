/* global describe, test, jest, expect */
import { logEnv } from '../envUtil';

global.console = { log: jest.fn() };

describe('envReport', () => {
  test('print env', () => {
    process.env.TEST_SERVICE_HOST = 'test-host';
    process.env.TEST_SERVICE_PORT = '1111';
    process.env.TEST_SERVICE_VERSION = 'v01';
    process.env.SOMETHING_ELSE = 'shoult-not-be-included';
    logEnv();
    expect(console.log).toBeCalledWith('TEST_SERVICE_HOST=test-host');
    expect(console.log).toBeCalledWith('TEST_SERVICE_VERSION=v01');
    expect(console.log).toBeCalledWith('TEST_SERVICE_PORT=1111');
    expect(console.log).not.toBeCalledWith('SOMETHING_ELSE=shoult-not-be-included');
  });
});
