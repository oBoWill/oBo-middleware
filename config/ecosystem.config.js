const path = require('path');

const clientRuntimeEnv = { TESTING: true };

function initEcosystem(env) {
  if (env.APM_NO_FILE_LOG) {
    console.log('APM_NO_FILE_LOG is true, log will not be written to log file');
  }

  let UI_ENV = {};
  for(let key in env) {
    let match = /^UI_(.+)/.exec(key)
    if(match) UI_ENV[match[1]] = env[key];
  }

  env.UI_ENV_JSON = JSON.stringify(UI_ENV);

  return {
    apps: [
      {
        name: 'web-app',
        cwd: path.join(__dirname, '../'),
        script: './dist/server/index.js',
        // watch: true,
        exec_mode: 'cluster',
        instances: env.INSTANCES || 0,
        merge_logs: true,
        output: env.APM_NO_FILE_LOG ? '/dev/null' : './dist/logs/web-app-out.log',
        error: env.APM_NO_FILE_LOG ? '/dev/null' : './dist/logs/web-app-err.log',
        interpreter_args: env.NODE_ARGS,
        env,
      },
    ],
  };
}

module.exports = initEcosystem;
