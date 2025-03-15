import * as fs from "fs";
import { join } from "path";

import Utils from "./Utils.js";
import { Config } from "./Config.js";
import { Options } from "./types.js";
import PostProxyServer from "./PostProxyServer.js";

class EnvManage {
  /**
   * 应用启动配置
   */
  options: Options;

  /**
   * 配置文件地址
   */
  configPath: string;

  /**
   * 后置代理服务器 和 管理服务器
   */
  manageServer: PostProxyServer | null = null;

  /**
   * 配置信息
   */
  config: Config;

  constructor(options: Options = {}) {
    this.options = options;
  }

  /**
   * 加载插件配置
   * @returns
   */
  getEnvPluginConfig() {
    return this.config.initConfig(this.options.config).then(() => {
      console.log("Config file loaded");
    });
  }

  async startIndependent(isPlugin: boolean = false) {
    this.config = new Config(isPlugin);

    this.getEnvPluginConfig()
      .then(() => {
        this.manageServer = new PostProxyServer();
      })
      .catch(() => {
        // todo 错误处理
      });
  }

  /**
   * 初始化配置文件
   * @param {boolean} force - 是否强制覆盖
   */
  static async initConfig(force = false) {
    const isESModule = await Utils.isESModuleByPackageJson();

    const FILE_EXT = isESModule ? ".mjs" : ".js";

    const CONFIG_FILE_NAME = `envm.config${FILE_EXT}`;
    // 模板文件路径
    const TEMPLATE_PATH = join(
      __dirname,
      `..`,
      `templates`,
      `${CONFIG_FILE_NAME}`
    );
    // 目标文件路径
    const TARGET_PATH = join(process.cwd(), CONFIG_FILE_NAME);
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
      console.error("Failed to initialize envm.config.js:", err);
    }
  }
}

export { EnvManage };
