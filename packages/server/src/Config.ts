import { EventEmitter } from "events";

import { DevServerItem, EnvItem, APP_STATUS_TYPE } from "./types.js";

export const FILE_CHANGE_EVENT = "filechange";

class Config {
  /**
   * 单例模式
   */
  private static instance: Config;

  /**
   * 环境信息列表
   */
  envMap: Map<
    string,
    EnvItem & {
      status?: APP_STATUS_TYPE;
    }
  > = new Map();

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
  isPlugin!: boolean;

  constructor(isPlugin = false) {
    if (Config.instance) {
      return Config.instance;
    }
    Config.instance = this;
    this.isPlugin = isPlugin;
  }
}

export { Config };
