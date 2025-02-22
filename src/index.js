const path = require("path");
const yargs = require("yargs/yargs");
const chokidar = require("chokidar");
const { hideBin } = require("yargs/helpers");
const ManageServer = require("./ManageServer");
const PreProxyServer = require("./PreProxyServer");
const PostProxyServer = require("./PostProxyServer");

class EnvManage {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap("EnvManagePlugin", (compilation) => {
      this.startIndependent();
    });
  }

  getConfigPath() {
    // 解析命令行参数
    const argv = yargs(hideBin(process.argv)).option("config", {
      alias: "c",
      type: "string",
      description: "config path 配置文件地址",
    }).argv;

    const configPath = argv.config || this.options.config || "./env.config.js";

    this.configPath = path.resolve(process.cwd(), configPath);
  }

  getEnvPluginConfig() {
    const modulePath = this.configPath;
    try {
      delete require.cache[require.resolve(modulePath)]; // 清除缓存
      this.envConfig = require(modulePath);
    } catch (error) {
      console.error(`Failed to load module at ${modulePath}:`, error);
      this.envConfig = { envList: [] }; // 设置默认值为空数组
    }

    const {
      port = 3099,
      devServerUrl = "http://localhost:5173",
      basePath = "/dev-manage-api",
      envList = [],
      devServerList = [],
    } = this.envConfig;

    this.envConfig.port = port;
    this.envConfig.devServerUrl = devServerUrl;
    this.envConfig.basePath = basePath;

    ManageServer.envList = envList;
    ManageServer.devServerList = devServerList;
  }

  startIndependent() {
    // 读取配置文件
    this.getConfigPath();
    this.getEnvPluginConfig();

    // 后置转发 和 管理路由
    this.postProxyServer = new PostProxyServer(this.envConfig.port);

    // 使用前置转发  所有请求都会先转发到 dev-server
    this.preProxyServer = new PreProxyServer(this.envConfig.devServerUrl);

    const manageServer = new ManageServer(
      this.preProxyServer.getApp,
      this.postProxyServer.getApp,
      this.envConfig.basePath
    );

    this.watchConfig();
  }

  watchConfig() {
    const watcher = chokidar.watch(this.configPath, {
      persistent: true,
    });

    watcher.on("change", () => {
      console.log("Config file changed");
      this.getEnvPluginConfig();
    });
  }
}

module.exports = EnvManage;
