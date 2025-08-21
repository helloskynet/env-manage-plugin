import portfinder from "portfinder";
import http from "http";
import PostProxyServer from "./PostProxyServer.js";
import { getConfig, loadConfig } from "./utils/ResolveConfig.js";
import { EnvmConfigInterface } from "./types/index.js";
import { startDatabase } from "./repositories/database.js";
import { initLoggers, logger } from "./utils/logger.js";

class EnvManage {
  get config() {
    return getConfig();
  }

  constructor(options: Partial<EnvmConfigInterface> = {}) {
    loadConfig(options);
    initLoggers(options.logLevel || "");
  }

  async startIndependent() {
    logger.info(this.config, "Starting EnvManage...");

    // 检查端口是否被占用
    try {
      await this.checkPortAsync();

      logger.info(`端口 ${this.config.port} 可用，启动服务...`);

      await startDatabase();
      new PostProxyServer();
    } catch (error) {
      console.error("端口检查失败:", error);
    }
  }

  /**
   * 判断端口是否被占用，如果被占用的，查询是否已经启动
   * @returns
   */
  async checkPortAsync() {
    const result = await this.isPortOccupied(this.config.port);
    if (result) {
      await this.checkIsRunning();
      throw new Error(`请确认服务是否已经在端口 ${this.config.port} 启动`);
    }
  }

  /**
   *
   * @param port 查询端口是否被占用
   * @returns
   */
  isPortOccupied(port: number) {
    return portfinder
      .getPortPromise({
        port: port,
        stopPort: port,
      })
      .then(() => {
        return false;
      })
      .catch(() => {
        return true;
      });
  }
  /**
   * 查询端口，中启动的服务是否为 envm
   * @returns
   */
  checkIsRunning() {
    const options = {
      hostname: "127.0.0.1",
      port: this.config.port,
      path: `${this.config.apiPrefix}/are-you-ok`,
      method: "GET",
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        const statusCode = res.statusCode || 0;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          return;
        }
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          const result = JSON.parse(responseData);
          logger.info(result);
          resolve(result);
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }
}

export { EnvManage };
