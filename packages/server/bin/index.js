#!/usr/bin/env node

import { program } from "commander";
import { EnvManage } from "../dist/index.js";

program.description("Environment management tool").name("envm");

// 添加默认命令
program
  .command("default", { isDefault: true }) // 默认命令
  .description("Start EnvManage")
  // 添加命令行选项
  .option("-p, --port <number>", "specify the port number", Number)
  .option("-a, --api-prefix <string>", "specify the API prefix", String)
  .option("-c, --cookie-suffix <string>", "specify the cookie suffix", String)
  .option(
    "-l, --log-level <string>",
    "specify the log level (info, debug, warn, error)",
    String
  )
  .action((options) => {
    const envMangePlugin = new EnvManage(options);
    envMangePlugin.startIndependent();
  });

program.parse();
