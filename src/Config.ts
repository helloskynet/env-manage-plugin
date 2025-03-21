import fs from "fs";
import http from "http";
import path from "path";
import chokidar from "chokidar";
import { EventEmitter } from "events";

import Utils from "./Utils.js";
import { DevServerItem, EnvConfig, EnvItem } from "./types.js";

export const FILE_CHANGE_EVENT = "filechange";

class Config {
  /**
   * 单例模式
   */
  private static instance: Config;

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

  /**
   * 事件总线
   */
  bus: EventEmitter = new EventEmitter();

  /**
   * 是否通过 plugin 模式启动，用于控制提示信息
   */
  isPlugin: boolean;

  constructor(isPlugin = false) {
    if (Config.instance) {
      return Config.instance;
    }
    Config.instance = this;
    this.isPlugin = isPlugin;
  }

  /**
   * 初始化配置文件加载器
   * @param configPath
   * @returns
   */
  async initConfig(configPath: string) {
    const localConfigPath = this.resolveAndValidateConfigPath(configPath);
    this.filePath = path.resolve(process.cwd(), localConfigPath);

    await this.loadConfig();
    await this.checkPortAsync();
    this.watchConfig();
  }

  /**
   * 解析并验证配置文件路径
   * @param configPath 配置文件路径（可选）
   * @returns 配置文件路径
   */
  resolveAndValidateConfigPath(configPath: string) {
    const finalConfigPath = configPath || this.resolveDefaultConfigFilePath();
    if (!fs.existsSync(finalConfigPath)) {
      const message = this.isPlugin
        ? "无法找到配置文件，请在插件配置中指定配置文件！"
        : "无法找到配置文件，请使用 npx envm init 初始化配置文件！或者通过 --config 指定配置文件！";
      console.error(message);
      throw new Error("配置文件不存在");
    }
    return finalConfigPath;
  }

  /**
   * 解析默认的配置文件路径
   * @returns 配置文件路径或 null
   */
  resolveDefaultConfigFilePath() {
    const exts = [".js", ".cjs", ".mjs"];
    for (const ext of exts) {
      const configFilePath = path.resolve(process.cwd(), `envm.config${ext}`);
      if (fs.existsSync(configFilePath)) {
        return configFilePath;
      }
    }
    return null;
  }

  /**
   * 重新加载配置文件
   */
  loadConfig() {
    const modulePath = this.filePath;

    delete require.cache[require.resolve(modulePath)];

    return import(modulePath)
      .then((module) => {
        return module.default || module;
      })
      .then((res) => {
        this.resolveConfig(res);
      })
      .catch((err) => {
        console.error(`配置文件加载失败 ${modulePath}:`, err);
      });
  }

  /**
   * 转换读取到的配置，设置默认值，去除重复数据
   * @param resolveDConfig
   * @returns
   */
  resolveConfig(resolveDConfig: EnvConfig) {
    let {
      port = 3099,
      basePath = "/dev-manage-api",
      envList = [],
      devServerList = [],
      indexPage = "",
      isEnableCookieProxy = true,
    } = resolveDConfig;

    devServerList = Utils.removeEnvDuplicates<DevServerItem>(devServerList);

    const defaultDevServerName = devServerList[0]?.name;

    const envToDevServerMap: typeof this.envToDevServerMap = {};

    envList = Utils.removeEnvDuplicates<EnvItem>(envList).map((item) => {
      const rowKey = Utils.getRowKey(item);

      let devServerName = `${
        this.envToDevServerMap[rowKey] || item?.devServerName
      }`;
      if (this.findDevServerByName(devServerName, devServerList)) {
        if (this.envToDevServerMap[rowKey]) {
          envToDevServerMap[rowKey] = this.envToDevServerMap[rowKey];
        }
      } else {
        devServerName = defaultDevServerName;
      }
      return {
        ...item,
        indexPage: `${item?.indexPage ?? indexPage}`,
        isEnableCookieProxy: item?.isEnableCookieProxy ?? isEnableCookieProxy,
        devServerName,
      };
    });

    this.envToDevServerMap = envToDevServerMap;

    this.envConfig = {
      ...resolveDConfig,
      port,
      envList,
      basePath,
      indexPage,
      devServerList,
      isEnableCookieProxy,
    };
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
            this.bus.emit(FILE_CHANGE_EVENT, {
              action: "filechange",
            });
            console.log("Config file reloaded");
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
    const findKey = Utils.getRowKey({
      name,
      port,
    });
    return this.envConfig.envList.find((item) => {
      const rowKey = Utils.getRowKey(item);
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

  /**
   * 判断端口是否被占用，如果被占用的，查询是否已经启动
   * @returns
   */
  checkPortAsync() {
    return Utils.isPortOccupied(this.envConfig.port).then((result) => {
      if (result) {
        return this.checkIsRunning().then((res: Config) => {
          console.log(
            `服务已启动在端口 ${this.envConfig.port} 配置文件地址为 ${res.filePath} 请检查`
          );
          throw new Error("服务已经启动");
        });
      }
    });
  }

  /**
   * 查询端口，中启动的服务是否为 envm
   * @returns
   */
  checkIsRunning() {
    const options = {
      hostname: "127.0.0.1",
      port: this.envConfig.port,
      path: `${this.envConfig.basePath}/are-you-ok`,
      method: "GET",
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          return;
        }
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          const result = JSON.parse(responseData);
          resolve(result);
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }
}

export { Config };
