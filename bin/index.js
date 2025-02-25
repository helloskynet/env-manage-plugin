#!/usr/bin/env node

const EnvManagePlugin = require("../src/index");

const argvConfig = EnvManagePlugin.resolveConfigFormArgv();

const envMangePlugin = new EnvManagePlugin({
  config: argvConfig.config,
});

envMangePlugin.startIndependent();
