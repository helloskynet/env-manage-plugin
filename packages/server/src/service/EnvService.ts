import PreProxyServer from "../PreProxyServer.js";
import { EnvRepo } from "../repositories/EnvRepo.js";
import { EnvBaseInterface, EnvItemInterface, EnvItemPartial } from "envm";
import { AppError } from "../utils/errors.js";

/**
 * 环境服务类
 * 负责处理与环境相关的请求
 */
class EnvService {
  constructor(private envRepo: EnvRepo) {}

  /**
   * 添加环境
   * @param envItem
   * @returns
   */
  handleAddEnv(envItem: EnvItemInterface) {
    console.log("添加环境", envItem);
    const existingEnv = this.envRepo.findOneByIpAndPort(envItem);
    if (!existingEnv) {
      this.envRepo.addEnv(envItem);
    } else {
      throw new AppError(
        `添加失败，环境 【${existingEnv.ip}:${existingEnv.port}】 已存在`
      );
    }
  }

  /**
   * 删除环境
   * @param envItem 环境信息
   * @returns {void}
   * @throws {Error} 如果环境不存在
   */
  handleDeleteEnv(envItem: EnvBaseInterface): void {
    console.log("删除环境", envItem);
    const env = this.envRepo.findOneByIpAndPort(envItem);
    if (env) {
      this.envRepo.deleteEnv(envItem);
      console.log("删除环境成功", envItem);
    } else {
      console.error("删除环境失败", envItem, "不存在");
      throw new AppError(`删除失败，环境 【${envItem}】 不存在`);
    }
  }

  /**
   * 更新环境信息
   * @param envItem
   */
  handleUpdateEnv(envItem: EnvItemPartial) {
    this.envRepo.updateEnvmItem(envItem);
  }

  /**
   * 获取环境列表
   * @returns
   */
  handleGetList() {
    const list = this.envRepo.getAll();
    return list;
  }

  /**
   * 启动代理服务器
   * @param env
   * @returns
   */
  async handleStartServer(env: EnvBaseInterface) {
    const envItem = this.envRepo.findOneByIpAndPort(env);
    if (envItem) {
      // 先停止该端口的服务
      await this.handleStopServer(env);
      // 再启动服务
      await PreProxyServer.create(envItem, this.envRepo);
      // 更新数据库
      await this.updateEnvStatus(env, "running");
    } else {
      throw new AppError("环境不存在");
    }
  }

  /**
   * 停止代理服务器
   * @param env
   * @param res
   * @returns
   */
  async handleStopServer(env: EnvBaseInterface) {
    // 停止服务
    await PreProxyServer.stopServer(env.port);

    // 查询数据库中3000端口正在运行的服务
    const envItem = this.envRepo.findOneByPortAndStatus({
      port: env.port,
      status: "running",
    });

    // 如果有则关闭
    if (envItem) {
      await this.updateEnvStatus(envItem, "stopped");
    }
  }

  /**
   * 更新环境信息
   * @param envItem
   */
  handleUpdateDevServerId(envItem: EnvItemPartial) {
    this.envRepo.updateEnvmItem(envItem);
  }

  /**
   * 更新服务状态
   * @param env
   * @param status
   * @returns
   */
  private updateEnvStatus(
    env: EnvBaseInterface,
    status: "running" | "stopped"
  ) {
    // 查找最新的环境信息（避免使用旧引用）
    const envItem = this.envRepo.findOneByIpAndPort(env);
    if (envItem) {
      // 更新状态并提交
      envItem.status = status;
      this.envRepo.update(envItem); // 假设update是异步方法（若同步可去掉await）
    }

    return envItem;
  }
}

export { EnvService };
