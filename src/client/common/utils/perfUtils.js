export function checkPerfOnTime(timeout = 5000, text) {
  if (!window || !window.Perf) return false;
  window.Perf.start();
  console.log(`__________________${text}_________________`);
  setTimeout(() => {
    window.Perf.stop();
    window.Perf.printWasted();
    console.log(`__________________${text}_________________`);
  }, timeout);
}
