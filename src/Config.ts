import fs from "fs";
import path from "path";
// 导入 chokidar 模块
import chokidar from "chokidar";

import { pathToFileURL } from "url";
import { EventEmitter } from "events";

import Utils from "./Utils.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const FILE_CHANGE_EVENT = "filechange";
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
   * 用于清除 import 缓存
   */
  configFileCacheBuster = 0;

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
    let localConfigPath = configPath;
    if (!configPath) {
      localConfigPath = this.checkFileExists(process.cwd(), "envm.config");
    }
    if (!fs.existsSync(localConfigPath)) {
      console.log(
        "无法找到配置文件，请使用 npm/yarn envm init 初始化配置文件！或者通过 --config 指定配置文件！"
      );
      process.exit(1);
    }
    this.filePath = path.resolve(process.cwd(), localConfigPath);
    return this.loadConfig().then(() => {
      this.watchConfig();
    });
  }

  /**
   * 检查文件夹中的指定文件是否存在
   * @param folderPath
   * @param targetFileName
   * @returns
   */
  checkFileExists(folderPath: string, targetFileName: string) {
    // 读取指定文件夹下的所有文件和文件夹
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      // 获取文件名（不包含扩展名）
      const baseName = path.basename(file, path.extname(file));
      if (baseName.toLowerCase() === targetFileName.toLowerCase()) {
        return file;
      }
    }
    return "";
  }

  /**
   * 重新加载配置文件
   */
  loadConfig() {
    const modulePath = this.filePath;

    delete require.cache[require.resolve(modulePath)];

    const fileUrl = pathToFileURL(path.resolve(modulePath)).href;
    const urlWithCacheBuster = `${fileUrl}?v=${this.configFileCacheBuster++}`;
    return import(urlWithCacheBuster)
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
    } = resolveDConfig;

    devServerList = Utils.removeEnvDuplicates<DevServerItem>(devServerList);

    const defaultDevServerName = devServerList[0]?.name;

    const envToDevServerMap: typeof this.envToDevServerMap = {};

    envList = Utils.removeEnvDuplicates<EnvItem>(envList).map((item) => {
      const rowKey = Utils.getRowKey(item);

      let devServerName = `${this.envToDevServerMap[rowKey] || item?.devServerName}`;
      if (this.findDevServerByName(devServerName, devServerList)) {
        if (this.envToDevServerMap[rowKey]) {
          envToDevServerMap[rowKey] = this.envToDevServerMap[rowKey];
        }
      } else {
        devServerName = defaultDevServerName;
      }
      return {
        ...item,
        indexPage: `${item.indexPage || indexPage || ""}`,
        devServerName,
      };
    });

    this.envToDevServerMap = envToDevServerMap;

    this.envConfig = {
      ...resolveDConfig,
      port,
      basePath,
      envList,
      devServerList,
      indexPage,
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
