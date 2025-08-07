
import { db } from "./database.js";
import { DevServerModel } from "../models/DevServerModel.js";

export interface DevServerRepoInterface {
  getAll(): DevServerModel[];
}

class DevServerRepo implements DevServerRepoInterface {

  /**
   *
   * @param isPlugin 是否通过 plugin 模式启动，用于控制提示信息
   * @returns
   */
  constructor() {
  }

  /**
   * 获取所有环境信息
   * @returns 环境信息列表
   */
  getAll() {
    const devServer = db.getCollection<DevServerModel>("devServer");
    const list = devServer.find();
    console.log("从数据库获取的开发服务器信息：", list);
    return list;
  }

  /**
   * 新增环境
   */
  addEnv(devServerItem: DevServerModel) {
    const devServerCol = db.getCollection<DevServerModel>("devServer");
    devServerCol.insert(devServerItem);
  }

  findById(id: string) {
    const devServerCol = db.getCollection<DevServerModel>("devServer");
    const item = devServerCol.findOne({ id });
    if (!item) {
      throw new Error(`未找到 ID 为 ${id} 的开发服务器`);
    }
    return item;
  }
}

export { DevServerRepo };
