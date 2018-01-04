global.env = require('../init.env.js');

// hack
window.matchMedia = window.matchMedia || function() {
    return {
      matches : false,
      addListener : function() {},
      removeListener: function() {}
    };
  };
class MutationObserver {
  constructor() {

  }
}
global.MutationObserver = MutationObserver;

window.requestIdleCallback = (fn, { timeout } = { timeout: 0 }) => setTimeout(fn, timeout);
global.requestIdleCallback = window.requestIdleCallback;