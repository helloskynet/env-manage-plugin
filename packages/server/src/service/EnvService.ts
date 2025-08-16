import { v4 as uuidv4 } from "uuid";
import PreProxyServer from "./PreProxyServer.js";
import { EnvRepo } from "../repositories/EnvRepo.js";
import {
  EnvCreate,
  EnvDelete,
  EnvQuery,
  EnvUpdate,
  EnvModel,
} from "@envm/schemas";
import { AppError } from "../utils/errors.js";
import { DevServerRepo } from "../repositories/DevServerRepo.js";

/**
 * 环境服务类
 * 负责处理与环境相关的核心业务逻辑，包括环境的增删改查、服务器启停等操作
 * 依赖环境仓库(EnvRepo)和开发服务器仓库(DevServerRepo)实现数据持久化和关联操作
 */
class EnvService {
  /**
   * 构造函数 - 通过依赖注入初始化仓库实例
   * @param envRepo - 环境仓库实例，用于环境数据的持久化操作
   * @param devServerRepo - 开发服务器仓库实例，用于关联开发服务器的操作
   */
  constructor(private envRepo: EnvRepo, private devServerRepo: DevServerRepo) {}

  /**
   * 添加新环境
   * 1. 校验输入参数合法性 2. 检查环境是否已存在 3. 生成唯一ID 4. 保存新环境
   * @param envItem - 待添加的环境信息（不含ID）
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当环境已存在（通过apiBaseUrl判断）时抛出
   */
  handleAddEnv(envItem: EnvCreate): void {
    // 参数校验

    console.log("准备添加环境", envItem);

    // 检查环境是否已存在（通过apiBaseUrl唯一标识）
    const existingEnv = this.envRepo.findOneByApiBaseUrl(envItem);
    if (existingEnv) {
      throw new AppError(`添加失败，环境【${existingEnv.apiBaseUrl}】已存在`);
    }

    // 生成唯一ID并组装完整环境信息
    const newEnvItem: EnvModel = {
      ...envItem,
      id: uuidv4(),
      status: "stopped", // 默认初始状态为停止
    };

    // 保存环境
    this.envRepo.addEnv(newEnvItem);
    console.log("环境添加成功", newEnvItem.id);
  }

  /**
   * 删除指定环境
   * 1. 校验输入参数 2. 检查环境是否存在 3. 执行删除操作
   * @param envItem - 包含待删除环境ID的对象
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当环境不存在时抛出
   */
  handleDeleteEnv(envItem: EnvDelete): void {
    // 参数校验

    const { id } = envItem;
    console.log("准备删除环境", id);

    // 检查环境是否存在
    const existingEnv = this.envRepo.findOneById(id);
    if (!existingEnv) {
      throw new AppError(`删除失败，环境【${id}】不存在`);
    }

    // 执行删除
    this.envRepo.deleteEnv(envItem);
    console.log("环境删除成功", id);
  }

  /**
   * 更新环境信息
   * 1. 校验输入参数 2. 检查环境是否存在 3. 执行更新操作
   * @param envItem - 包含待更新环境ID及字段的对象
   * @returns {void}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当环境不存在时抛出
   */
  handleUpdateEnv(envItem: EnvUpdate): void {
    // 参数校验

    const { id } = envItem;
    console.log("准备更新环境", id);

    // 检查环境是否存在
    const existingEnv = this.envRepo.findOneById(id);
    if (!existingEnv) {
      throw new AppError(`更新失败，环境【${id}】不存在`);
    }

    // 执行更新
    this.envRepo.update(envItem);
    console.log("环境更新成功", id);
  }

  /**
   * 获取所有环境列表
   * @returns {EnvModel[]} 环境信息数组
   */
  handleGetList(): EnvModel[] {
    const list = this.envRepo.getAll();
    console.log(`查询到${list.length}个环境`);
    return list;
  }

  findOneById(id: string) {
    return this.envRepo.findOneById(id);
  }

  /**
   * 启动指定环境的代理服务器
   * 1. 校验参数 2. 检查环境存在性 3. 先停止同端口服务 4. 启动新服务 5. 更新状态
   * @param env - 包含待启动环境ID的对象
   * @returns {Promise<void>}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当环境不存在时抛出
   * @throws {Error} 当服务器启动失败时抛出
   */
  async handleStartServer(env: EnvQuery): Promise<void> {
    const { id } = env;
    console.log("准备启动环境服务", id);

    // 检查环境是否存在
    const envItem = this.envRepo.findOneById(id);
    if (!envItem) {
      throw new AppError(`启动失败，环境【${id}】不存在`);
    }

    try {
      // 先查与当前服务同端口的环境，如果启动，则关闭掉
      await this.stopServerAtSamePort(envItem);

      // 启动新的代理服务器
      await PreProxyServer.create(id, this.envRepo, this.devServerRepo);

      // 更新环境状态为运行中
      await this.updateEnvStatus({
        ...env,
        status: "running",
      });
      console.log("环境服务启动成功", id);
    } catch (error) {
      console.error("环境服务启动失败", id, error);
      throw new AppError(`启动服务失败：${(error as Error).message}`);
    }
  }

  /**
   * 关闭指定端口的服务
   * @param port
   */
  private async stopServerAtSamePort(envItem: EnvModel) {
    // 先查与当前服务同端口的环境，如果启动，则关闭掉
    const samePortAndRunningEnv = this.envRepo.findOne({
      $and: [
        { id: { $ne: envItem.id } }, // $ne 表示 "不等于"
        { port: envItem.port },
        { status: "running" }, // 直接匹配等于的值
      ],
    });
    if (samePortAndRunningEnv) {
      console.log(
        `关闭 ${samePortAndRunningEnv.port} 端口服务`,
        samePortAndRunningEnv.name
      );
      await this.handleStopServer(samePortAndRunningEnv);
    }
    console.log(`端口${envItem.port}没有服务启动`);
  }

  /**
   * 停止指定环境的代理服务器
   * 1. 校验参数 2. 检查环境存在性 3. 停止服务 4. 更新状态
   * @param env - 包含待停止环境ID的对象
   * @returns {Promise<void>}
   * @throws {AppError} 当输入参数不合法时抛出
   * @throws {AppError} 当环境不存在时抛出
   */
  async handleStopServer(env: EnvQuery): Promise<void> {
    const { id } = env;
    console.log("准备停止环境服务", id);

    // 检查环境是否存在
    const envItem = this.envRepo.findOneById(id);
    if (!envItem) {
      throw new AppError(`停止失败，环境【${id}】不存在`);
    }

    // 停止对应端口的服务
    await PreProxyServer.stopServer(id);
    console.log(`环境【${envItem.name}】的服务已停止`);
    // 更新环境的运行状态
    await this.updateEnvStatus({
      id,
      status: "stopped",
    });
  }

  /**
   * 私有方法：更新环境运行状态
   * @param env - 包含环境ID的对象
   * @param status - 目标状态（running/stopped）
   * @returns {Promise<EnvModel | undefined>} 更新后的环境信息
   */
  private async updateEnvStatus(env: EnvUpdate): Promise<EnvModel | undefined> {
    // 查找最新的环境信息（避免使用旧引用）
    const envItem = this.envRepo.findOneById(env.id);
    if (!envItem) {
      console.warn(`更新状态失败，环境【${env.id}】不存在`);
      return undefined;
    }

    // 执行状态更新
    const updatedEnv = { ...envItem, ...env };
    this.envRepo.update(updatedEnv);
    console.log(`环境【${env.id}】状态已更新为${updatedEnv.status}`);

    return updatedEnv;
  }
}

export { EnvService };
