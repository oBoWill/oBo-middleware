'use strict';

import https from 'https';
import fs from 'fs';
const cacert = fs.readFileSync('certs/cacert.pem', 'utf8');

// don't check host name for back end services
export function ignoreServerIdentity(host, cert) {
  // as we use self signed cert for back services and host name not matching
  return undefined;
}

export const apmServiceApiHttpsAgent = new https.Agent({
  ca: cacert,
  checkServerIdentity: ignoreServerIdentity,
});
