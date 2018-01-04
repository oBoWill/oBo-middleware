'use strict';

exports.register = (server, options, next) => {
  server.ext('onRequest', (request, reply) => {

    let redirect = options.proxy !== false
      ? request.headers['x-forwarded-proto'] === 'http'
      : request.connection.info.protocol === 'http';
    let host = request.headers['x-forwarded-host'] || request.headers.host;

    if(redirect) {
      return reply()
        .redirect(`https://${host}${request.url.path}`)
        .code(301);
    }
    reply.continue();
  });
  next();
};

exports.register.attributes = {
  name: 'apmRequireHttps',
  version: '1.0.0',
};
