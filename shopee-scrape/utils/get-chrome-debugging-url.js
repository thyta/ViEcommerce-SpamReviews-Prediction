const fetch = require('node-fetch');

async function fetchChromeDebuggingURL(debuggingPort) {
  const request = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
  const debuggingURL = await request.json();
  return debuggingURL.webSocketDebuggerUrl;
}

module.exports = fetchChromeDebuggingURL;
