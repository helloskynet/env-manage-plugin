#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import { EnvManage } from "../dist/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageVersion = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")).version;

program
.name("envm")
  .description("Environment management tool")
  .version(packageVersion, "-v, --version", "output the current version")
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
