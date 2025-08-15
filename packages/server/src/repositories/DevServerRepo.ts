import { CreateDevServerInterface, DevServerInterface } from "@envm/schemas";
import { db } from "./database";

export class DevServerRepo {
  // private collection: Collection<DevServerInterface>;

  /**
   * 获取环境集合的私有方法，减少重复代码
   */
  private get collection() {
    return db.getCollection<CreateDevServerInterface>("devServer");
  }

  constructor() {
    // 获取或创建集合
    // this.collection = db.getCollection<DevServerInterface>("devServer");
  }

  /**
   * 获取所有开发服务器
   * @returns 开发服务器列表
   */
  findAll(): DevServerInterface[] {
    return this.collection.find();
  }

  /**
   * 根据ID获取开发服务器
   * @param devServerUrl 服务器ID
   * @returns 开发服务器信息或null
   */
  findByDevServerUrl(devServerUrl: string): CreateDevServerInterface | null {
    return this.collection.findOne({ devServerUrl }) || null;
  }


  /**
   * 创建新的开发服务器
   * @param serverData 服务器信息
   * @returns 新创建的服务器信息
   */
  create(serverData: CreateDevServerInterface) {
      this.collection.insert(serverData);   
  }

  /**
   * 更新开发服务器信息
   * @param id 服务器ID
   * @param updateData 要更新的信息
   * @returns 更新后的服务器信息或null
   */
  update(
    id: string,
    updateData: Partial<DevServerInterface>
  ): DevServerInterface | null {
    const server = this.findByDevServerUrl(id);
    if (!server) {
      return null;
    }

    // 合并更新数据
    const updatedServer = { ...server, ...updateData, id };

    try {
      this.collection.update(updatedServer);
      db.saveDatabase();
      return updatedServer;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("duplicate")
      ) {
        throw new Error(`服务已存在`);
      }
      throw error;
    }
  }

  /**
   * 删除开发服务器
   * @param id 服务器ID
   * @returns 删除是否成功
   */
  delete(id: string): boolean {
    const server = this.findByDevServerUrl(id);
    if (!server) {
      return false;
    }

    this.collection.remove(server);
    db.saveDatabase();
    return true;
  }
}
