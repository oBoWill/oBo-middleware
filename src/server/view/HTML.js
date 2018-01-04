import fonts from './fonts.js';
let webAppGitId = 'no-commit-id';
try {
  let webAppBuildInfo = require('../../../build-info.json');
  if (webAppBuildInfo && webAppBuildInfo['git-commit-id-abbrev']) {
    webAppGitId = webAppBuildInfo['git-commit-id-abbrev'];
  }
} catch (error) {}

const HTML = (props, title) => `
  <!DOCTYPE html>
  <html lang="en">

      <head>

          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

          <link rel="shortcut icon" href="/__static/favicon.ico" type="image/x-icon">
          <link rel="icon" type="image/png" href="/__static/favicon.png" />

          <title>${ title }</title>

          <link href="/__static/vendor.css" rel="stylesheet" />
          <link href="/__static/agile-ui.css" rel="stylesheet" />
          <link href="/__static/index.css" rel="stylesheet" />

      </head>

      <body>

        <!-- Application View -->
        <div id="app-mount"></div>

        <!-- Vendor Source -->
        <script src="/__static/manifest.${webAppGitId}.js"></script>
        <script src="/__static/vendor.${webAppGitId}.js"></script>

        <!-- State Bootstrapping -->
        <script id="app-state">
          window.INITIAL_STATE = ${JSON.stringify(props)};
          window.env = ${process.env.UI_ENV_JSON};
          window.__title = '${title}';
        </script>

        <!-- Application -->
        <script src="/__static/agile-ui.${webAppGitId}.js"></script>
        <script src="/__static/index.${webAppGitId}.js"></script>

        <!-- Browser Sync -->
        ${
          process.env.NODE_ENV !== 'production' ?
            `<script async src="http://127.0.0.1:3002/browser-sync/browser-sync-client.js?v=2.17.5"></script>` : ''
        }

      </body>

  </html>
`;

export default HTML;
