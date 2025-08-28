#!/usr/bin/env node

import { program } from "commander";
import { EnvManage } from "../src/index.js";
import { EnvmConfigInterface } from "../src/types/index.js";

program
  .description("Environment management tool")
  .name("envm")
  .option("-p, --port <number>", "specify the port number", Number)
  .option("-a, --api-prefix <string>", "specify the API prefix", String)
  .option("-c, --cookie-suffix <string>", "specify the cookie suffix", String)
  .option(
    "-l, --log-level <string>",
    "specify the log level (info, debug, warn, error)",
    String
  )
  .action((options: EnvmConfigInterface) => {
    const envMangePlugin = new EnvManage(options);
    envMangePlugin.startIndependent();
  });

program.parse();
