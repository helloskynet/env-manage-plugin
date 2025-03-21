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

}

export { EnvManage };
