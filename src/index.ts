import { Config } from "./Config.js";
import { Options } from "./types.js";
import PostProxyServer from "./PostProxyServer.js";

class EnvManage {
  /**
   * 应用启动配置
   */
  options: Options;

  constructor(options: Options = {}) {
    this.options = options;
  }

  async startIndependent(isPlugin: boolean = false) {
    const config = new Config(isPlugin);

    await config
      .initConfig(this.options.config)
      .then(() => {
        console.log("Config file loaded");
        new PostProxyServer();
      })
      .catch(() => {
        // todo 错误处理
      });
  }
}

export { EnvManage };
