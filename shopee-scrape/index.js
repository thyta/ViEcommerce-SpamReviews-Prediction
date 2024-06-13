const puppet = require('puppeteer');
const path = require('path');
const { promises: fsPromise } = require('fs');
const csv = require('csv-stringify');
const { configs: commandLineConfigs, commandLineOptions, commandLineUsage } = require('./args-parser');
const scrape = require('./scraper/scrape');
const getChromeDebuggerURL = require('./utils/get-chrome-debugging-url');

// Print help message.
if (commandLineOptions[commandLineConfigs.HELP.name]) {
  console.log(commandLineUsage);
}

console.log(commandLineOptions);

// TODO: Due to time contraints, only implementing single-file parsing for now.

async function main() {
  // Read file
  const links = await fsPromise.readFile(path.join(__dirname, 'links.txt'), 'utf-8');
  // console.log(links);

  // Parse and store links
  const urls = links.split('\n').map(url => url.replace('\r', '')).filter(url => url !== '');

  console.log('Crawling', urls.length, 'links');

  // Get Chrome debugging link
  const chromeDebuggerURL = await getChromeDebuggerURL(9222);

  console.log('Launching application with Chrome Debugger URL:', chromeDebuggerURL);

  // Fetch the first 3 links
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    console.log('--------------------------');
    console.log(`Crawling link #${i + 1}.`);
    console.log('--------------------------');
    await scrape(url, chromeDebuggerURL);
  }

  return 0;
}

main().then(() => {
  console.log('Crawl finished. Exiting...');
  process.exit(0);
});

// (async () => {
//   // Start browser in non-headless mode.
//   const browser = await puppet.connect({
//     headless: false,
//     // browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/623d9676-067e-4bcd-b3de-b805b4c6ef23'
//     browserURL: 'http://127.0.0.1:9222'
//   });
  
//   // Open a new tab.
//   const page = await browser.newPage();
// })()