#!/usr/bin/env node

const { program } = require("commander");
const { EnvManage } = require("../dist/index.js");
const packageJson = require("../package.json");

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

// 初始化配置文件
program
  .command("init")
  .description("Init config file 初始化配置文件")
  .option("-f, --force", "force init config file 强制初始化配置文件")
  .action((options) => {
    EnvManage.initConfig(options.force);
  });

program.parse();
