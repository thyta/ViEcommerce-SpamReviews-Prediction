const commandLineUsage = require('command-line-usage')
const commandLineArgsConfigs = require('../configs');

const usage = commandLineUsage([
  {
    header: 'SScraper - Your Typical Shopee Scraper!',
    content: 'This section describes typical usages for this library.'
  },
  {
    header: 'Options',
    optionList: commandLineArgsConfigs
  },
  // {
  //   content: 'Project home: {underline https://github.com/me/example}'
  // }
]);

module.exports = usage;
