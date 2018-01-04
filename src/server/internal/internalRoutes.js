import infoHandler from './info';

function addInfoRoute (server) {
  server.route({
    method: 'GET',
    path: '/internal/info',   // this request is from browser
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
      auth: false,
      handler: infoHandler,
    },
  });
}

function addHealthcheckRoute (server) {
  server.route({
    method: 'GET',
    path: '/internal/health',   // this request is from browser
    config: {
      state: {
        parse: true, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
      auth: false,
      handler: (req, res) => {
        res({ status: 'UP' });
      },
    },
  });
}

function addStorybookRoute (server) {
  if(process.env.STORYBOOK_ENABLED === 'true' || process.env.STORYBOOK_ENABLED === true) {
    server.route({
      method: 'GET',
      path: '/internal/storybook/{path*}',   // this request is from browser
      config: {
        state: {
          parse: true, // parse and store in request.state
          failAction: 'ignore', // may also be 'ignore' or 'log'
        },
        auth: false,
        handler: {
          directory: {
            path: '../../node_modules/agile-ui/storybook-dist/',
            listing: false,
          },
        },
      },
    });
  }
}

function addInternalRoutes (server) {
  addHealthcheckRoute(server);
  addInfoRoute(server);
  addStorybookRoute(server);
}

export { addInfoRoute };
export { addHealthcheckRoute };
export { addStorybookRoute };
export { addInternalRoutes };
