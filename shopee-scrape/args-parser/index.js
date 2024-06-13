const configs = require("../configs/args-config.enum");
const commandLineOptions = require("./parser");
const commandLineUsage = require("./usage");

module.exports = {
  commandLineOptions,
  commandLineUsage,
  configs,
  // argNames: configs
};
