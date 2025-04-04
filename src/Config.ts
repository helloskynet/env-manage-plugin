import fs from "fs";
import http from "http";
import path from "path";
import chokidar from "chokidar";
import { EventEmitter } from "events";

import Utils from "./Utils.js";
import {
  DevServerItem,
  EnvmConfig,
  EnvItem,
  APP_STATUS,
  APP_STATUS_TYPE,
} from "./types.js";

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
  envmConfig: EnvmConfig;

  /**
   * 环境信息列表
   */
  envMap: Map<string, EnvItem & { status?: APP_STATUS_TYPE }> = new Map();

  /**
   * 开发服务器列表
   */
  devServerMap: Map<string, DevServerItem> = new Map();

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
  resolveConfig(resolveDConfig: EnvmConfig) {
    let {
      port = 3099,
      envList = [],
      indexPage = "",
      devServerList = [],
      cookieSuffix = "envm",
      isEnableCookieProxy = true,
      basePath = "/dev-manage-api",
    } = resolveDConfig;

    devServerList = Utils.removeEnvDuplicates<DevServerItem>(devServerList);
    this.devServerMap = Utils.generateMap(devServerList);

    const defaultDevServerName = devServerList[0]?.name;

    envList = Utils.removeEnvDuplicates<EnvItem>(envList);
    envList = envList.map((item) => {
      const rowKey = Utils.getRowKey(item);

      const oldEnvItem = this.envMap.get(rowKey);
      let devServerName = `${oldEnvItem?.devServerName || item?.devServerName}`;

      const devServerKey = Utils.getRowKey({ name: devServerName });

      if (!this.devServerMap.has(devServerKey)) {
        devServerName = defaultDevServerName;
      }
      return {
        ...item,
        indexPage: `${item?.indexPage ?? indexPage}`,
        isEnableCookieProxy: item?.isEnableCookieProxy ?? isEnableCookieProxy,
        status: oldEnvItem?.status ?? APP_STATUS.STOP,
        devServerName,
      };
    });

    this.envMap = Utils.generateMap(envList);

    this.envmConfig = {
      ...resolveDConfig,
      port,
      envList,
      basePath,
      indexPage,
      cookieSuffix,
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
   * 判断端口是否被占用，如果被占用的，查询是否已经启动
   * @returns
   */
  checkPortAsync() {
    return Utils.isPortOccupied(this.envmConfig.port).then((result) => {
      if (result) {
        return this.checkIsRunning().then((res: Config) => {
          console.log(
            `服务已启动在端口 ${this.envmConfig.port} 配置文件地址为 ${res.filePath} 请检查`
          );
          throw new Error("服务已经启动");
        });
      }
    });
  }

  /**
   * 对应代理启动之后，更新状态
   * @param envKey
   */
  startServer(envKey: string) {
    this.envMap.get(envKey).status = APP_STATUS.RUNNING;
  }

  /**
   * 对应的代理关闭之后，更新状态
   * @param envKey
   */
  stopServer(envKey: string) {
    this.envMap.get(envKey).status = APP_STATUS.STOP;
  }
  /**
   * 查询端口，中启动的服务是否为 envm
   * @returns
   */
  checkIsRunning() {
    const options = {
      hostname: "127.0.0.1",
      port: this.envmConfig.port,
      path: `${this.envmConfig.basePath}/are-you-ok`,
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
