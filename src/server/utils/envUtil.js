const variableNames = [
  'NODE_ENV', 'NODE_HTTPS',
  /_HOST$/, /_PORT$/, /_VERSION$/,
];

function variableNamesFilter(str) {
  for(let i = 0; i < variableNames.length; i++) {
    if(variableNames[i] instanceof RegExp) {
      if(variableNames[i].test(str)) return true;
    } else if(variableNames[i] === str) {
      return true;
    }
  }
  return false;
}

/**
 * Provide utility to print out important environment variables
 */
function logEnv() {
  console.log('============ Envirnoment Variables ===========');
  Object.keys(process.env).filter(variableNamesFilter)
    .map(key => ({ key, val: process.env[key] })).forEach((v) => {
      console.log(`${v.key}=${v.val}`);
    });
}

export { logEnv };

