import path from "path";
// 导入 chokidar 模块
import chokidar from "chokidar";

import { cosmiconfig, CosmiconfigResult, PublicExplorer } from "cosmiconfig";
import { EnvConfig } from ".";
import Utils from "./Utils";

// type CosmiconfigResult2 = {
//   Config: EnvConfig;
// } & Omit<CosmiconfigResult, "config">;

class Config {
  static instance: Config;
  /**
   * 配置文件加载器
   */
  explorer: PublicExplorer;

  /**
   * 配置文件地址
   */
  filePath: string;

  /**
   * 配置内容
   */
  envConfig: EnvConfig;

  constructor() {
    if (Config.instance) {
      return Config.instance;
    }
    Config.instance = this;
  }

  initConfig(configPath: string) {
    if (configPath) {
      this.filePath = path.resolve(process.cwd(), configPath);
    }
    this.explorer = cosmiconfig("envm", {
      searchStrategy: "none",
      transform: async (result) => {
        let {
          port = 3099,
          basePath = "/dev-manage-api",
          envList = [],
          devServerList = [],
          indexPage = "",
        } = result.config;

        envList = Utils.removeEnvDuplicates(envList);
        devServerList = Utils.removeEnvDuplicates(devServerList);

        Object.assign(result.config, {
          port,
          basePath,
          envList,
          devServerList,
          indexPage,
        });
        return result;
      },
    });
    if (this.filePath) {
      return this.loadConfig();
    }
    return this.searchConfig();
  }
  /**
   * 搜索并加载配置文件
   * @returns
   */
  searchConfig() {
    return this.explorer.search().then((result) => {
      this.resolveConfig(result);
      // 解析到对应的字段之后，，开始监听
      this.watchConfig();
    });
  }

  /**
   * 重新加载配置文件
   */
  loadConfig() {
    return this.explorer.load(this.filePath).then((result) => {
      this.resolveConfig(result);
    });
  }

  resolveConfig(result: CosmiconfigResult) {
    if (result) {
      // console.log("配置文件路径:", result.filepath);
      // console.log("解析后的配置:", result.config);
      this.filePath = result.filepath;
      this.envConfig = result.config;
    } else {
      console.log("未找到配置文件");
    }
  }

  watchConfig() {
    if (!this.filePath) {
      return;
    }
    const watcher = chokidar.watch(this.filePath, {
      persistent: true,
    });

    let debounceTimer: NodeJS.Timeout;
    watcher.on("change", () => {
      console.log("Config file changed");
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.loadConfig()
          .then(() => {
            // this.updatePostProxyServerConfig();
          })
          .catch((error) => {
            console.error("Error updating config:", error);
          });
      }, 500);
    });
  }

  /**
   * 获取指定的 开发服务器
   * @param name
   * @returns
   */
  findDevServerByName(name: string) {
    return this.envConfig.devServerList.find((item) => item.name === name);
  }
}

export { Config };
