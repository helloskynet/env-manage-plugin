import { DevServerRepo } from "../repositories/DevServerRepo";
import { DevServerInterface } from "@envm/schemas";

export class DevServerService {
  constructor(private readonly devServerRepository: DevServerRepo) {}

  /**
   * 获取开发服务器列表
   * @returns 开发服务器列表
   */
  getDevServerList(): DevServerInterface[] {
    return this.devServerRepository.findAll();
  }

  /**
   * 根据ID获取开发服务器
   * @param id 服务器ID
   * @returns 开发服务器信息或null
   */
  getDevServerById(id: string): DevServerInterface | null {
    return this.devServerRepository.findById(id);
  }

  /**
   * 创建新的开发服务器
   * @param serverData 服务器信息
   * @returns 新创建的服务器信息
   */
  createDevServer(serverData: DevServerInterface) {
    // 可以在这里添加业务逻辑验证，例如检查端口是否已被占用
    const existingServer = this.devServerRepository.findByPort(serverData.port);
    if (existingServer) {
      throw new Error(`端口 ${serverData.port} 已被占用`);
    }

    this.devServerRepository.create(serverData);
  }

  /**
   * 更新开发服务器信息
   * @param id 服务器ID
   * @param updateData 要更新的信息
   * @returns 更新后的服务器信息或null
   */
  updateDevServer(
    id: string,
    updateData: Partial<DevServerInterface>
  ): DevServerInterface | null {
    // 如果更新了端口，检查新端口是否已被占用
    if (updateData.port) {
      const existingServer = this.devServerRepository.findByPort(
        updateData.port
      );
      if (existingServer && existingServer.id !== id) {
        throw new Error(`端口 ${updateData.port} 已被占用`);
      }
    }

    return this.devServerRepository.update(id, updateData);
  }

  /**
   * 删除开发服务器
   * @param id 服务器ID
   * @returns 删除是否成功
   */
  deleteDevServer(id: string): boolean {
    return this.devServerRepository.delete(id);
  }
}
