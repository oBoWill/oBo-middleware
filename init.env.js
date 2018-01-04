'use strict';
require( 'babel-core/register' );

const fs = require('fs');
const path = require('path');

// Capture arguments.
const argv = require('yargs')
  .alias('e', 'environment')
  .argv;

let environment = argv.environment || '';

try {
  // Check if config exists.
  let configPath = path.join(__dirname, `./.env${environment ? '.' + environment : ''}`);
  fs.accessSync(configPath, fs.constants.R_OK);
} catch (e) {
  // It isn't accessible, use default.
  environment = 'default';
}

// Load build environment variables from '.env' file.
let setEnv = require('dotenv').config({
  silent: true,
  path: `./.env${environment ? '.' + environment : ''}`,
});

// Fill any missing values with defaults.
let defaultEnv = require('dotenv').config({
  silent: true,
  path: './.env.default',
});

// Attempt to coerce/parse env vars.
let env = Object.assign({}, defaultEnv, setEnv);
for(let key in env) {
  try {
    env[key] = JSON.parse(env[key]);
  } catch(e) {
    continue;
  }
}

// Environment object to be passed to configurations:
module.exports =  Object.assign({}, process.env, env);

require('./src/server/index.js')


