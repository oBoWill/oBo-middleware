/* global describe, test, jest, expect */
import { wrapErrorResponse } from './../errorHandlingUtil';

const testResponse = {
  response: {
    data: {
      error: {
        message: 'test error',
      },
    },
  },
};

describe('envReport', () => {
  test('wrap error response', () => {

    testResponse.response.status = 400;
    let response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(400);
    expect(response.output.payload.error).toBe('Bad Request');

    testResponse.response.status = 401;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(401);
    expect(response.output.payload.error).toBe('Unauthorized');

    testResponse.response.status = 403;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(403);
    expect(response.output.payload.error).toBe('Forbidden');

    testResponse.response.status = 404;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(404);
    expect(response.output.payload.error).toBe('Not Found');

    testResponse.response.data.path = '/test_path';
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.message).toBe(`Path ${testResponse.response.data.path} not found`);

    testResponse.response.status = 405;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(405);
    expect(response.output.payload.error).toBe('Method Not Allowed');

    testResponse.response.status = 409;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(409);
    expect(response.output.payload.error).toBe('Conflict');

    testResponse.response.status = 412;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(412);
    expect(response.output.payload.error).toBe('Precondition Failed');

    testResponse.response.status = 500;
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(422);
    expect(response.output.payload.error).toBe('Unprocessable Entity');

    testResponse.response = null;
    testResponse.code = 'ECONNABORTED'
    response = wrapErrorResponse(testResponse);
    expect(response.output.payload.statusCode).toBe(504);
    expect(response.output.payload.error).toBe('Gateway Time-out');

  });
});