import path from "path";
// 导入 chokidar 模块
import chokidar from "chokidar";

import { cosmiconfig, CosmiconfigResult, PublicExplorer } from "cosmiconfig";

import Utils from "./Utils";

// type CosmiconfigResult2 = {
//   Config: EnvConfig;
// } & Omit<CosmiconfigResult, "config">;

/**
 * 开发服务器配置
 */
export type DevServerItem = {
  name: string;
  target: string;
};

/**
 * 转发路由配置
 */
type RouterFunction = (req: unknown, env: EnvItem) => string;

/**
 * 环境配置
 */
export type EnvItem = {
  name: string;
  port: number;
  target: string;
  indexPage?: string;
  devServerName: string;
  router?: RouterFunction;
};

/**
 * 应用配置
 */
export type EnvConfig = {
  port: number;
  basePath: string;
  indexPage: string;
  devServerList: Array<DevServerItem>;
  envList: Array<EnvItem>;
};

class Config {
  /**
   * 单例模式
   */
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

  /**
   * 运行中的环境对应的，devServer
   */
  envToDevServerMap: Record<string, string> = {};

  constructor() {
    if (Config.instance) {
      return Config.instance;
    }
    Config.instance = this;
  }

  /**
   * 初始化配置文件加载器
   * @param configPath
   * @returns
   */
  initConfig(configPath: string) {
    if (configPath) {
      this.filePath = path.resolve(process.cwd(), configPath);
    }
    this.explorer = cosmiconfig("envm", {
      searchStrategy: "none",
      transform: async (result) => {
        if (!result) {
          return result;
        }
        let {
          port = 3099,
          basePath = "/dev-manage-api",
          envList = [],
          devServerList = [],
          indexPage = "",
        } = result.config;

        devServerList = Utils.removeEnvDuplicates<DevServerItem>(devServerList);

        const defaultDevServerName = devServerList[0]?.name;

        envList = Utils.removeEnvDuplicates<EnvItem>(envList).map((item) => {
          const rowKey = Utils.getRowKey(item);

          let devServerName = `${this.envToDevServerMap[rowKey] || item?.devServerName}`;
          if (!this.findDevServerByName(devServerName, devServerList)) {
            devServerName = defaultDevServerName;
          }
          return {
            ...item,
            indexPage: `${item.indexPage || indexPage || ""}`,
            devServerName,
          };
        });

        this.envToDevServerMap = {};

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
    return this.loadConfig();
  }

  /**
   * 重新加载配置文件
   */
  loadConfig() {
    let explorer = Promise.resolve();
    if (this.filePath) {
      explorer = this.explorer.load(this.filePath).then((result) => {
        this.resolveConfig(result);
      });
    } else {
      explorer = this.explorer
        .search()
        .then((result) => {
          this.resolveConfig(result);
        })
        .then(() => {
          this.watchConfig();
        });
    }
    explorer.catch((err: Error) => {
      if (err.message === "Not Found") {
        console.error(
          "未找到配置文件，请运行 npm/yarn envm init 初始化配置文件！"
        );
      } else {
        console.log("配置文件加载异常");
      }
    });
    return explorer;
  }

  /**
   * 根据加载结果解析
   * @param result
   */
  resolveConfig(result: CosmiconfigResult) {
    if (result) {
      this.filePath = result.filepath;
      this.envConfig = result.config;
    } else {
      throw new Error("Not Found");
    }
  }

  watchConfig() {
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
   * 根据 name 查询开发服务器
   * @param name
   * @returns
   */
  findDevServerByName(name: string, devServerList?: DevServerItem[]) {
    const list = devServerList || this.envConfig.devServerList;
    return list.find((item) => item.name === name);
  }

  /**
   * 根据 name 和 port 查询环境信息
   * @param name
   * @param port
   * @returns
   */
  findEnvByNameAndPort(name: string, port: number | string) {
    const findKey = `${name}+${port}`;
    return this.envConfig.envList.find((item) => {
      const rowKey = `${item.name}+${item.port}`;
      return findKey === rowKey;
    });
  }

  /**
   * 查询运行中的环境对应的 devServer
   * @param name  环境名称
   * @param port 环境端口
   * @returns 该环境对应的 devServer
   */
  findDevServerForEnv(name: string, port: number | string) {
    const rowKey = Utils.getRowKey({
      name,
      port,
    });
    let devServerName = this.envToDevServerMap[rowKey];
    if (!devServerName) {
      const envItem = this.findEnvByNameAndPort(name, port);
      devServerName = envItem.devServerName;
    }
    return this.findDevServerByName(devServerName);
  }
}

export { Config };
