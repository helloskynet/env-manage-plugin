import { EnvRepo } from "../repositories/EnvRepo";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { EnvService } from "./EnvService";

/**
 * 代理自动启动器
 * 负责在应用启动时检查并启动数据库中状态为运行的代理
 */
export class ProxyAutoStarter {
  constructor(
    private readonly envRepo: EnvRepo,
    private readonly proxyService: EnvService
  ) {
    this.start();
  }

  /**
   * 应用启动时执行的代理检查和启动逻辑
   */
  async start(): Promise<void> {
    try {
      logger.info("开始检查需要自动启动的代理...");

      // 查询数据库中状态为"运行中"的代理
      const runningProxies = this.envRepo.findAllByStatus("running");

      if (runningProxies.length === 0) {
        logger.info("没有需要自动启动的代理");
        return;
      }

      logger.info(
        `发现${runningProxies.length}个状态为运行的代理，准备启动...`
      );

      // 逐个启动代理，记录成功和失败的数量
      let successCount = 0;
      let failCount = 0;

      // 使用for循环而非forEach以支持异步等待
      for (const proxy of runningProxies) {
        try {
          logger.info(`正在启动代理 [${proxy.name}] (ID: ${proxy.id})`);

          // 检查代理是否已经在运行（避免重复启动）
          // await this.proxyService.handleStartServer({
          //   id: proxy.id,
          // });
          // if (isAlreadyRunning) {
          //   console.warn(`代理 [${proxy.name}] 已在运行，跳过启动`);
          //   successCount++;
          //   continue;
          // }

          // 启动代理
          await this.proxyService.handleStartServer(proxy);
          logger.info(`代理 [${proxy.name}] 启动成功`);
          successCount++;
        } catch (error) {
          logger.error(
            error,
            `代理 [${proxy.name}] (ID: ${proxy.id}) 启动失败:`
          );
          failCount++;
        }
      }

      // 输出启动结果统计
      logger.info(
        `代理自动启动完成 - 成功: ${successCount}, 失败: ${failCount}, 总计: ${runningProxies.length}`
      );
    } catch (error) {
      logger.error(error, "代理自动启动流程失败:");
      // 根据实际需求决定是否抛出错误终止应用，或仅记录错误
      throw new AppError("代理自动启动流程执行失败");
    }
  }
}
