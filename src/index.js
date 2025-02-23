const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
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

  async getEnvPluginConfig() {
    const modulePath = this.configPath;

    try {
      // 清除缓存（仅对 CommonJS 有效）
      delete require.cache[require.resolve(modulePath)];

      // 判断文件类型
      if (
        modulePath.endsWith(".mjs") ||
        (modulePath.endsWith(".js") && this.isESModule(modulePath))
      ) {
        // 动态加载 ES Module

        const fileUrl = pathToFileURL(path.resolve(modulePath)).href;
        const module = await import(fileUrl);
        this.envConfig = module.default || module;
      } else {
        // 使用 require 加载 CommonJS
        this.envConfig = require(modulePath);
      }
    } catch (error) {
      console.error(`Failed to load module at ${modulePath}:`, error);
      this.envConfig = { envList: [] }; // 设置默认值为空数组
    }

    const {
      port = 3099,
      basePath = "/dev-manage-api",
      envList = [],
      devServerList = [],
    } = this.envConfig;

    this.envConfig.port = port;
    this.envConfig.basePath = basePath;

    ManageServer.envList = envList;
    ManageServer.devServerList = devServerList;
  }

  async startIndependent() {
    // 读取配置文件
    this.getConfigPath();
    await this.getEnvPluginConfig();

    // 后置转发 和 管理路由
    this.postProxyServer = new PostProxyServer(this.envConfig.port);

    // 使用前置转发  所有请求都会先转发到 dev-server
    this.preProxyServer = new PreProxyServer();

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

  /**
   * 判断文件是否是 ES Module
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  isESModule(filePath) {
    try {
      // 检查文件扩展名
      if (filePath.endsWith(".mjs")) return true;
      if (filePath.endsWith(".cjs")) return false;

      // 检查 package.json 的 type 字段
      const dir = path.dirname(filePath);
      const packageJsonPath = path.join(dir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath);
        return packageJson.type === "module";
      }

      // 检查文件内容
      const content = fs.readFileSync(filePath, "utf8");
      return content.includes("export default") || content.includes("export ");
    } catch (error) {
      console.error(`Failed to check module type at ${filePath}:`, error);
      return false;
    }
  }
}

module.exports = EnvManage;
