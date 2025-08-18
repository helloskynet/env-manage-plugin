import pino from "pino";
import { config } from "./ResolveConfig.js";

// 创建日志实例（默认输出 JSON 格式，适合生产环境）
export const logger = pino({
  level: config.logLevel, // 日志级别：只输出 >= 该级别的日志（trace < debug < info < warn < error < fatal）
  base: {
    pid: process.pid, // 进程 ID（默认已包含，可自定义）
    service: "envm", // 服务名称（便于多服务日志区分）
  },
  transport: {
    target: "pino-pretty",
  },
  timestamp: pino.stdTimeFunctions.isoTime, // 时间格式：ISO 标准时间
});

/**
 * API服务器，相关日志
 */
export const envLogger = logger.child({
  module: "env",
});

/**
 * 代理服务器相关日志
 */
export const devServerLogger = logger.child({
  module: "devServer",
});

/**
 * 代理日志
 */
export const proxyLogger = logger.child({
  module: "proxy",
});
