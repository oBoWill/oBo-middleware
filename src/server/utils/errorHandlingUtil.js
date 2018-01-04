/**
 * Created by rj on 01/02/17.
 */
import Boom from 'boom'

/**
 * Utility function to wrap axios errors (or general errors) with an appropriate Boom Response.
 * @param failure - An error which may or may not have an axios response from the server.
 */
export const wrapErrorResponse = (failure) => {
  console.log('Wrapping Error:', failure.code, failure.response);
  // See if there is a response from the server and take the appropriate action
  if (failure.response) {
    const message = (failure.response.data && failure.response.data.error && failure.response.data.error.message)
      || failure.response.statusText;
    switch (failure.response.status) {
      case 400:
        return Boom.badRequest(message);
      case 401:
        //TODO: Deal with scheme
        return Boom.unauthorized(message);
      case 403:
        return Boom.forbidden(message, failure.response.data);
      case 404:
        if(failure.response.data.path)
          return Boom.notFound(`Path ${failure.response.data.path} not found`, failure.response.data);
        return Boom.notFound(message, failure.response.data);
      case 405:
        //TODO: Deal with Allowed Methods (Does API return?)
        return Boom.methodNotAllowed(message, failure.response.data);
      case 409:
        return Boom.conflict(message, failure.response.data);
      case 412:
        return Boom.preconditionFailed(message, failure.response.data);
      case 500:
        // console.log('wrapError:', message, failure);
        return Boom.badData(message, failure.response.data);
      default:
        return Boom.wrap(failure, failure.response.status);

    }
  }
  // Handle Server timeout by returning a gateway timeout.
  else if(failure.code === 'ECONNABORTED'){
    return Boom.gatewayTimeout();
  }
  // if all else fails return a 500
  else {
    return Boom.wrap(failure, 500, 'Unable to perform request');
  }
};
