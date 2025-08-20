#!/usr/bin/env node

const { program } = require("commander");
const { EnvManage } = require("../dist/index.js");
const packageJson = require("../../../package.json");

program
  .name("envm")
  .version(packageJson.version);

// 添加默认命令
program
  .command("default", { isDefault: true }) // 默认命令
  .description("Start EnvManage")
  .action(() => {
    // const options = program.opts();
    const envMangePlugin = new EnvManage();
    envMangePlugin.startIndependent();
  });

program.parse();
