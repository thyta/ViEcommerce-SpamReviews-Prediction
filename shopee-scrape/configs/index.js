const argConfigs = require('./args-config.enum');

module.exports = Object.keys(argConfigs).map(argKey => argConfigs[argKey]);
