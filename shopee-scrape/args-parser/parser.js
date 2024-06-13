const commandLineArgs = require('command-line-args');
const commandLineArgsConfigs = require('../configs');

const commandLineOptions = commandLineArgs(commandLineArgsConfigs);

module.exports = commandLineOptions;
