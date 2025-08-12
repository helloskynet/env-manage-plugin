import { DevServerRepo } from "../repositories/DevServerRepo";
import { CreateDevServerInterface, DevServerInterface, UpdateDevServerInterface } from "@envm/schemas";
import { AppError } from "../utils/errors";

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
  createDevServer(serverData: CreateDevServerInterface) {
    try {
      this.devServerRepository.create(serverData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Duplicate')) {
        throw new AppError(`创建失败: ${serverData.id} 已存在！` );
      }
      throw error;
    }
  }

  /**
   * 更新开发服务器信息
   * @param id 服务器ID
   * @param updateData 要更新的信息
   * @returns 更新后的服务器信息或null
   */
  updateDevServer(
    id: string,
    updateData: Partial<UpdateDevServerInterface>
  ): DevServerInterface | null {
    // 如果更新了端口，检查新端口是否已被占用
    if (updateData.id) {
      const existingServer = this.devServerRepository.findById(
        updateData.id
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
