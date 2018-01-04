import { Seq, fromJS } from 'immutable';

import moment from 'moment';

import stringify from 'fast-safe-stringify';


const invalidKeyPaths = (val, root = new Seq(), filter = () => true) => {
  // End of object properties, value is primitive, return empty path.
  if(typeof val !== 'object') return [];
  // Iterate keys/values.
  return new Seq(val).reduce((curr, value, key) => {
    // Is invalid, add path as invalid keyPath.
    if(!filter(value, key)) return curr.concat([root.concat(key)]);
    // Valid, recurse.
    return curr.concat(invalidKeyPaths(value, root.concat(key), filter));
  }, new Seq());
};

function parseMessageItem(item, cfi) {

  if(cfi) {

    const { filter, whitelist, blacklist } = cfi;
    const parserFilter = (val, key) =>
      (blacklist && !~blacklist.indexOf(key))
      || (whitelist && ~whitelist.indexOf(key))
      || (filter && filter(val, key));

    if(item) {
      let immutableItem = fromJS(JSON.parse(stringify(item))).asMutable();
      let removePaths = invalidKeyPaths(item, new Seq(), parserFilter);
      removePaths.forEach((path) => {
        immutableItem.removeIn(path);
      });

      item = immutableItem.toJS();
    }

  }

  return JSON.stringify(item);

}

function formatMessage(args, cfi, level) {

  let outputArgs = [];

  for(let i = 0; i < args.length; i++) {

    let item = args[i];
    switch(typeof item) {
      case 'object':
        outputArgs.push(parseMessageItem(item, cfi));
        break;
      case 'string':
        // TODO: find way to filter blacklisted values from string output
        // TODO: should we remove newline statements?
        outputArgs.push(item.replace(/[\n\r]/g, '\s'));
        break;
      default:
        outputArgs.push(item);
    }

  }

  let { dateFormat, name, version } = cfi;
  let message = outputArgs.join('');
  let timestamp = moment().format(dateFormat);
  return `${timestamp}\t${process.pid}\t${name}\t${version}\t${level}:\t${message}`;

}

const defaultConfig = {
  name: 'web-app',
  // TODO: provide commit hash as version ?
  version: process.env.NODE_API_VERSION,
  dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS Z',
  blacklist: ['password', 'email', 'credentials'],
};


// TODO: add `.bindReq` method to return custom bound logger obj for use in routes
export default function captureLogs(cfi = {}) {

  cfi = Object.assign({}, defaultConfig, cfi);

  const globalConsole = global.console;
  const defaultLog = globalConsole.log;
  const defaultInfo = globalConsole.info;
  const defaultWarn = globalConsole.warn;
  const defaultError = globalConsole.error;

  const noop = () => null;
  globalConsole.log = noop;
  globalConsole.info = noop;
  globalConsole.warn = noop;
  globalConsole.error = noop;


  // TODO: apply iteratively based on config ?
  switch(process.env.LOGGING_LEVEL) {
    case 'DEBUG':
      globalConsole.debug = (...args) => defaultLog.call(globalConsole, formatMessage(args, cfi, 'DEBUG'));
      globalConsole.log = (...args) => defaultLog.call(globalConsole, formatMessage(args, cfi, 'DEBUG'));
    case 'INFO':
      globalConsole.info = (...args) => defaultInfo.call(globalConsole, formatMessage(args, cfi, 'INFO'));
    case 'WARN':
      globalConsole.warn = (...args) => defaultWarn.call(globalConsole, formatMessage(args, cfi, 'WARN'));
    case 'ERROR':
      globalConsole.error = (...args) => defaultError.call(globalConsole, formatMessage(args, cfi, 'ERROR'));
  }


};