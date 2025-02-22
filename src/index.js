const path = require("path");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// 解析命令行参数
const argv = yargs(hideBin(process.argv)).option("config", {
  alias: "n",
  type: "string",
  description: "config path 配置文件地址",
}).argv;

console.log(argv.config);

// 读取配置文件
const envConfigPath = path.resolve(
  process.cwd(),
  argv.config || "./env.config.js"
);

const envConfig = require(envConfigPath);

const ManageServer = require("./ManageServer");

ManageServer.envList = envConfig.envList;

// 使用前置转发  所有请求都会先转发到webpack-dev-server
const PreProxyServer = require("./PreProxyServer");
const preProxyServer = new PreProxyServer(
  envConfig.devServerUrl || "http://localhost:5173"
);

// 后置转发 和 管理路由
const PostProxyServer = require("./PostProxyServer");
const { env } = require("process");
const postProxyServer = new PostProxyServer(envConfig.port || 3099);

const manageServer = new ManageServer(
  preProxyServer.getApp,
  postProxyServer.getApp,
  envConfig.basePath || "/dev-manage-api"
);
