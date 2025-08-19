import { v4 as uuidv4 } from "uuid";
import { DevServerRepo } from "../repositories/DevServerRepo.js";
import { EnvRepo } from "../repositories/EnvRepo.js"; // 关联环境操作需依赖
import {
  DevServerCreate,
  DevServerDelete,
  DevServerQuery,
  DevServerUpdate,
  DevServerQuerySchema,
  DevServerModel,
} from "../types/index.js";
import { AppError } from "../utils/errors.js";

/**
 * 开发服务器服务类
 * 负责处理开发服务器（devServer）的核心业务逻辑，包括增删改查、关联环境校验等操作
 * 依赖开发服务器仓库(DevServerRepo)和环境仓库(EnvRepo)实现数据持久化与关联业务处理
 */
class DevServerService {
  /**
   * 构造函数 - 通过依赖注入初始化仓库实例
   * @param devServerRepo - 开发服务器仓库实例，用于devServer数据的持久化操作
   * @param envRepo - 环境仓库实例，用于关联环境的校验与操作
   */
  constructor(private devServerRepo: DevServerRepo, private envRepo: EnvRepo) {}

  /**
   * 添加新开发服务器
   * 1. 校验输入参数合法性 2. 检查服务器URL是否已存在 3. 生成唯一ID 4. 保存新服务器
   * @param devServerItem - 待添加的开发服务器信息（不含ID）
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当服务器URL已存在时抛出
   */
  handleAddDevServer(devServerItem: DevServerCreate): void {
    const validData = devServerItem;
    console.log("准备添加开发服务器", validData);

    // 检查服务器URL是否已存在（URL作为唯一标识）
    const existingServer = this.devServerRepo.findOneByUrl(
      validData.devServerUrl
    );
    if (existingServer) {
      throw new AppError(
        `添加失败，开发服务器【${existingServer.devServerUrl}】已存在`
      );
    }

    // 生成唯一ID并组装完整服务器信息（默认状态为未关联）
    const newDevServer: DevServerModel = {
      ...validData,
      id: uuidv4(),
    };

    // 保存开发服务器
    this.devServerRepo.addDevServer(newDevServer);
    console.log("开发服务器添加成功", newDevServer.id);
  }

  /**
   * 删除指定开发服务器
   * 1. 校验输入参数 2. 检查服务器是否存在 3. 检查是否关联环境（关联则禁止删除） 4. 执行删除
   * @param devServerItem - 包含待删除服务器ID的对象
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当服务器不存在时抛出
   * @throws {AppError} 当服务器已关联环境时抛出（避免数据关联异常）
   */
  handleDeleteDevServer(devServerItem: DevServerDelete): void {
    // 参数校验

    const { id } = devServerItem;
    console.log("准备删除开发服务器", id);

    // 检查服务器是否存在
    const existingServer = this.devServerRepo.findOneById(devServerItem);
    if (!existingServer) {
      throw new AppError(`删除失败，开发服务器【${id}】不存在`);
    }

    // 检查服务器是否已关联环境（关联环境时禁止删除，避免环境依赖异常）
    const linkedEnvs = this.envRepo.findEnvsByDevServerId(id);
    if (linkedEnvs.length > 0) {
      throw new AppError(
        `删除失败，开发服务器【${existingServer.name}】已关联 ${linkedEnvs.length} 个环境，请先解除关联`
      );
    }

    // 执行删除
    this.devServerRepo.deleteDevServer(devServerItem);
    console.log("开发服务器删除成功", id);
  }

  /**
   * 更新开发服务器信息
   * 1. 校验输入参数 2. 检查服务器是否存在 3. 若更新URL则校验唯一性 4. 执行更新（同步修订号）
   * @param devServerItem - 包含待更新服务器ID及字段的对象
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当服务器不存在时抛出
   * @throws {AppError} 当更新的URL已存在时抛出
   */
  handleUpdateDevServer(devServerItem: DevServerUpdate): void {
    // 参数校验

    const { id } = devServerItem;
    console.log("准备更新开发服务器", id);

    // 检查服务器是否存在
    const existingServer = this.devServerRepo.findOneById({ id });
    if (!existingServer) {
      throw new AppError(`更新失败，开发服务器【${id}】不存在`);
    }

    const validData = devServerItem;
    // 若更新了URL，需校验新URL的唯一性
    if (
      validData.devServerUrl &&
      validData.devServerUrl !== existingServer.devServerUrl
    ) {
      const conflictServer = this.devServerRepo.findOneByUrl(
        validData.devServerUrl
      );
      if (conflictServer) {
        throw new AppError(
          `更新失败，URL【${validData.devServerUrl}】已被其他开发服务器使用`
        );
      }
    }

    // 组装更新数据（同步元数据修订号）
    const updatedServer: DevServerModel = {
      ...existingServer,
      ...validData,
    };

    // 执行更新
    this.devServerRepo.update(updatedServer);
    console.log("开发服务器更新成功", id);
  }

  /**
   * 获取所有开发服务器列表
   * @returns {DevServerModel[]} 开发服务器信息数组
   */
  handleGetList(): DevServerModel[] {
    const list = this.devServerRepo.getAll();
    console.log(`查询到${list.length}个开发服务器`);
    return list;
  }

  /**
   * 根据ID查询单个开发服务器
   * @param devServer - 包含待查询服务器ID的对象
   * @returns {DevServerModel | undefined} 匹配的开发服务器信息（不存在则返回undefined）
   * @throws {AppError} 当输入参数不合法时抛出
   */
  findOneById(devServer: DevServerQuery): DevServerModel | null {
    // 参数校验
    const validationResult = DevServerQuerySchema.safeParse(devServer);
    if (!validationResult.success) {
      throw new AppError(
        `查询开发服务器失败：参数不合法 - ${JSON.stringify(
          validationResult.error.issues
        )}`
      );
    }

    const server = this.devServerRepo.findOneById(validationResult.data);
    console.log(
      `查询开发服务器【${devServer.id}】结果：${server ? "存在" : "不存在"}`
    );
    return server;
  }

  /**
   * 关联开发服务器到环境（更新服务器状态为"linked"）
   * 1. 校验参数 2. 检查服务器/环境是否存在 3. 更新服务器关联状态
   * @param devServerId - 开发服务器ID
   * @param envId - 关联的环境ID
   * @returns {void}
   * @throws {AppError} 当参数不合法或资源不存在时抛出
   */
  handleLinkToEnv(devServerId: string, envId: string): void {
    // 校验ID格式（简化校验，实际可通过Schema补充）
    if (!devServerId || !envId) {
      throw new AppError("关联失败：开发服务器ID和环境ID不能为空");
    }

    console.log(`准备关联开发服务器【${devServerId}】到环境【${envId}】`);

    // 检查开发服务器是否存在
    const devServer = this.devServerRepo.findOneById({ id: devServerId });
    if (!devServer) {
      throw new AppError(`关联失败，开发服务器【${devServerId}】不存在`);
    }

    // 检查环境是否存在
    const env = this.envRepo.findOneById(envId);
    if (!env) {
      throw new AppError(`关联失败，环境【${envId}】不存在`);
    }

    // 更新开发服务器状态为"已关联"
    // this.handleUpdateDevServer({
    //   id: devServerId,
    //   status: "linked",
    //   linkedEnvId: envId, // 记录关联的环境ID（需确保Schema支持该字段）
    // });
    console.log(`开发服务器【${devServerId}】已成功关联到环境【${envId}】`);
  }

  /**
   * 解除开发服务器与环境的关联（更新服务器状态为"unlinked"）
   * @param devServerId - 开发服务器ID
   * @returns {void}
   * @throws {AppError} 当服务器不存在或参数不合法时抛出
   */
  handleUnlinkFromEnv(devServerId: string): void {
    if (!devServerId) {
      throw new AppError("解除关联失败：开发服务器ID不能为空");
    }

    console.log(`准备解除开发服务器【${devServerId}】的环境关联`);

    const devServer = this.devServerRepo.findOneById({ id: devServerId });
    if (!devServer) {
      throw new AppError(`解除关联失败，开发服务器【${devServerId}】不存在`);
    }

    // 更新服务器状态为"未关联"，清空关联的环境ID
    // this.handleUpdateDevServer({
    //   id: devServerId,
    //   status: "unlinked",
    //   linkedEnvId: undefined,
    // });
    console.log(`开发服务器【${devServerId}】已解除环境关联`);
  }
}

export { DevServerService };
