import jwtDecode from 'jwt-decode';
import b64 from 'b64';

export function maybeGetUserId(req) {

  // TODO: define method to better extract session(s) (avoiding changing existing for now)

  // Attempts to parse userId from token (for app user), else provides `null`.
  let session = req.auth.credentials;
  if(!session) session = req.state && req.state[process.env.COOKIE_NAME];
  let token = session ? (session.token || session.refreshToken) : null;
  let parsedSession = token && jwtDecode(token);

  // Attempts to get surveyHosting session obj.
  if(!parsedSession) {
    let cookie = req.state && req.state[`${process.env.SH_COOKIE_NAME}_${req.params.pid}`];
    parsedSession = cookie ? JSON.parse(b64.decode(new Buffer(cookie)).toString()) : null;
  }

  return parsedSession ? (parsedSession.uid || parsedSession.uniqueId) : null;

}

export function formatRequestId(req) {
  let idArr = req.id.toString().split(':');
  return idArr.slice(-3).join('_');
}

export function formatRequestLogMessage(req) {

  if(!req) return 'null\tnull\tnull\t-\t';

  // User/Participant ID set to null if no tokens present.
  const user_id = maybeGetUserId(req);
  const user_ip = req.info.remoteAddress;

  // Basic info being logged on ('info') level. Adding more would be simple.
  const req_id = formatRequestId(req);
  const request_method = req.method.toUpperCase();
  const request_path = req.url.href;
  const source = req.info.referrer || null;

  const status = req.response.output ? req.response.output.statusCode : '';
  const isError = (status >= 400 || req.response.isBoom);
  const message = isError ? req.response.message : '';

  const errorMessage = `${status ? `\t-\t${status}` : ''}${message ? ` ${message}` : ''}`;

  return `${user_id}\t${user_ip}\t${source}\t-\t${req_id} ${request_method} ${request_path}${errorMessage}`;

}

// TODO: support customization in options ?
function register(server, options, next) {

  server.on('log', (event, tags) => {
    let messagePrefix = `${formatRequestLogMessage(event.request)}\t|\t`;
    let method = 'log';
    if('info' in tags) method = 'info';
    if('warn' in tags) method = 'warn';
    if('error' in tags) method = 'error';
    console[method](messagePrefix, event.data);
  });

  server.on('request-error', (req, err) => {
    console.error(formatRequestLogMessage(req), err.message, err.stack);
  });

  server.ext('onPreResponse', (req, res) => {

    const status = req.response.output && req.response.output.statusCode;
    const isError = (status >= 400 || req.response.isBoom);
    const message = formatRequestLogMessage(req);

    isError ? console.error(message) : console.info(message);

    return res.continue();

  });

  return next();

}

register.attributes = { name: 'request-logger', version: 'v0.0.1' };

export default { register };
