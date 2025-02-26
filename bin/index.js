#!/usr/bin/env node

const EnvManagePlugin = require("../src/index");

const argvConfig = EnvManagePlugin.resolveConfigFormArgv();

if (argvConfig._[0] === "init") {
  return;
}

const envMangePlugin = new EnvManagePlugin({
  config: argvConfig.config,
});

envMangePlugin.startIndependent();
