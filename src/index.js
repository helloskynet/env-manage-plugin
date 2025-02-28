const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const { pathToFileURL } = require("url");

const Utils = require("./Utils");
const PreProxyServer = require("./PreProxyServer");
const PostProxyServer = require("./PostProxyServer");

class EnvManage {
  configCacheBuster = 0; // 缓存破坏者

  constructor(options = {}) {
    this.options = options;

    const configPath = this.options?.config || "./env.config.js";
    this.configPath = path.resolve(process.cwd(), configPath);

    this.manageServer = {};
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap("EnvManagePlugin", (compilation) => {
      this.startIndependent();
    });
  }

  async getEnvPluginConfig() {
    const modulePath = this.configPath;

    let envConfig = {};
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

        const urlWithCacheBuster = `${fileUrl}?v=${this.configCacheBuster++}`;
        const module = await import(urlWithCacheBuster);
        envConfig = module.default || module;
      } else {
        // 使用 require 加载 CommonJS
        envConfig = require(modulePath);
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
    } = envConfig;

    this.envConfig = {
      port,
      basePath,
      envList,
      devServerList,
      indexPage,
    };
    console.log("Config file loaded");
  }

  async startIndependent() {
    await this.getEnvPluginConfig();

    this.preProxyServer = new PreProxyServer(this.envConfig);

    this.manageServer = new PostProxyServer(
      this.envConfig,
      this.preProxyServer
    );

    this.updatePostProxyServerConfig();

    this.watchConfig();
  }

  updatePostProxyServerConfig() {
    this.manageServer.envConfig = this.envConfig;
  }

  watchConfig() {
    const watcher = chokidar.watch(this.configPath, {
      persistent: true,
    });

    let debounceTimer;
    watcher.on("change", () => {
      console.log("Config file changed");
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.getEnvPluginConfig()
          .then(() => {
            this.updatePostProxyServerConfig();
          })
          .catch((error) => {
            console.error("Error updating config:", error);
          });
      }, 500);
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
      `../templates/${CONFIG_FILE_NAME}`
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
