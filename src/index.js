const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const chokidar = require("chokidar");
const ManageServer = require("./ManageServer");
const PreProxyServer = require("./PreProxyServer");
const PostProxyServer = require("./PostProxyServer");
const Utils = require("./Utils");

class EnvManage {
  cacheBuster = 0; // 缓存破坏者

  constructor(options = {}) {
    this.options = options;
    this.manageServer = {};
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap("EnvManagePlugin", (compilation) => {
      this.startIndependent();
    });
  }

  get configPath() {
    const configPath = this.options.config || "./env.config.js";

    return path.resolve(process.cwd(), configPath);
  }

  async getEnvPluginConfig() {
    const modulePath = this.configPath;

    try {
      // 清除缓存（仅对 CommonJS 有效）
      delete require.cache[require.resolve(modulePath)];

      // 判断文件类型
      if (
        modulePath.endsWith(".mjs") ||
        (modulePath.endsWith(".js") && Utils.isESModule(modulePath))
      ) {
        // 动态加载 ES Module

        const fileUrl = pathToFileURL(path.resolve(modulePath)).href;

        const urlWithCacheBuster = `${fileUrl}?v=${this.cacheBuster++}`;
        const module = await import(urlWithCacheBuster);
        this.envConfig = module.default || module;
      } else {
        // 使用 require 加载 CommonJS
        this.envConfig = require(modulePath);
      }
    } catch (error) {
      console.error(`Failed to load module at ${modulePath}:`, error);
      process.exit(1);
    }

    const {
      port = 3099,
      basePath = "/dev-manage-api",
      envList = [],
      devServerList = [],
      indexPage = "",
    } = this.envConfig;

    this.envConfig.port = port;
    this.envConfig.basePath = basePath;

    ManageServer.updateDevServerList(devServerList);

    ManageServer.udpateEnvList(envList, indexPage);
    console.log("Config file loaded");
  }

  async startIndependent() {
    await this.getEnvPluginConfig();

    // 后置转发 和 管理路由
    this.postProxyServer = new PostProxyServer(this.envConfig.port);

    // 使用前置转发  所有请求都会先转发到 dev-server
    this.preProxyServer = new PreProxyServer();

    this.manageServer = new ManageServer(
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
   * 初始化配置文件
   * @param {boolean} force - 是否强制覆盖
   */
  static initConfig(force = false) {
    const FILE_EXT = Utils.isESModuleByPackageJson() ? ".mjs" : ".js";

    const CONFIG_FILE_NAME = `env.config${FILE_EXT}`;
    // 模板文件路径
    const TEMPLATE_PATH = path.join(
      __dirname,
      `../template/${CONFIG_FILE_NAME}`
    );
    // 目标文件路径
    const TARGET_PATH = path.join(process.cwd(), CONFIG_FILE_NAME);
    try {
      // 检查目标文件是否存在
      const isTargetExist = fs.existsSync(TARGET_PATH);

      if (isTargetExist && !force) {
        console.log(
          `${CONFIG_FILE_NAME} already exists. Use --force to overwrite.`
        );
        return;
      }

      // 拷贝模板文件到目标路径
      fs.copyFileSync(TEMPLATE_PATH, TARGET_PATH);
      console.log(
        `${CONFIG_FILE_NAME} ${isTargetExist ? "overwritten" : "created"} successfully!`
      );
    } catch (err) {
      console.error("Failed to initialize env.config.js:", err);
    }
  }
}

module.exports = EnvManage;
