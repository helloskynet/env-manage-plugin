#!/usr/bin/env node

const { program } = require("commander");
const { EnvManage } = require("../src/index.ts");
const packageJson = require("../../../package.json");

program
  .name("envm")
  .option("-c, --config <string> Config path 配置文件地址")
  .version(packageJson.version);

// 添加默认命令
program
  .command("default", { isDefault: true }) // 默认命令
  .description("Start EnvManage")
  .action(() => {
    const options = program.opts();
    const envMangePlugin = new EnvManage({
      config: options.config,
    });
    envMangePlugin.startIndependent();
  });

program.parse();
