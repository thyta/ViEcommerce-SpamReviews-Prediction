const defaultArgValues = require('./default-arg-values');

module.exports = {
  LOG_LEVEL: {
    name: 'log-level',
    type: Number,
    defaultOption: defaultArgValues['log-level'],
    typeLabel: '[0-5]',
    description: 'Decides how noisy the output is. 0 is total silent, 5 is very noisy.'
  },
  LINKS: {
    name: 'links',
    alias: 'l',
    type: String,
    multiple: true,
    typeLabel: '<links>',
    description: 'Collection of links to crawl.'
  },
  DEBUGGING_PORT: {
    name: 'debugging-port',
    alias: 'p',
    type: Number,
    typeLabel: '<port>',
    description: 'Your Chrome\'s instance debugging port.'
  },
  FILE: {
    name: 'file',
    alias: 'f',
    type: String,
    typeLabel: '<file-name>',
    description: 'File name containing links to parse.'
  },
  INPUT_DIR: {
    name: 'input-dir',
    alias: 'i',
    type: String,
    typeLabel: '<path>',
    description: 'Directory to links used for parsing. Can be a collection of files containing links.'
  },
  OUTPUT_DIR: {
    name: 'output-dir',
    alias: 'o',
    type: String,
    typeLabel: '<path>',
    description: 'Directory where scraped links can be saved.'
  },
  FILE_TYPE: {
    name: 'file-type',
    alias: 't',
    type: String,
    typeLabel: '[csv|xls|xlsx|txt|raw]',
    defaultOption: defaultArgValues['file-type'],
    description: 'Specifies which file types the output should be.'
  },
  HELP: {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Displays this usage guide.'
  },
}