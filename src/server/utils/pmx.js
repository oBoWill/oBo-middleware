import pmx from 'pmx';

pmx.init({
  http: true, // (default: true) HTTP routes logging
  // custom_probes: true, // (default: true) Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network: true, // (default: false) Network monitoring at the application level
  ports: true, // (default: false) Shows which ports your app is listening on

  // Transaction Tracing system configuration
  transactions  : true, // (default: false) Enable transaction tracing
  // ignoreFilter: {
  //   'url': [],
  //   'method': ['OPTIONS'],
  // },
  // can be 'express', 'hapi', 'http', 'restify'
  // excludedHooks: ['hapi']
});

export default pmx;