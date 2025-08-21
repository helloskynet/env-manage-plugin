// src/utils/logger.ts
import pino, { Logger } from "pino";

// 日志初始化选项：需传入加载好的 config
export type CreateLoggerOptions = {
  // 可选：自定义日志配置（如生产环境添加脱敏）
  customOptions?: Partial<pino.LoggerOptions>;
};

let rootLogger: Logger | null = null;

/**
 * 创建根日志实例（Node.js 环境专用）
 * 优先级：customOptions > 默认配置
 */
export const createRootLogger = (logLevel: string): Logger => {
  if (rootLogger) return rootLogger;

  const level = logLevel || "info";
  // 默认配置：区分开发/生产环境
  const defaultConfig: pino.LoggerOptions = {
    level, // 从配置读取日志级别
    base: {
      service: "envm-service", // 服务名（多服务日志区分）
      // env: options.config.env || "development", // 环境标识（dev/prod/test）
      pid: process.pid, // Node.js 进程 ID
    },
    // 开发环境：格式化输出（pino-pretty）；生产环境：JSON 格式（便于日志收集工具解析）
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        encoding: "utf8",
        translateTime: "yyyy-mm-dd HH:MM:ss",
        hideObject: level === "info",
      },
    },
    // transport: options.config.env === "development"
    //   ? { target: "pino-pretty", options: { colorize: true, translateTime: "yyyy-MM-dd HH:mm:ss" } }
    //   : undefined,
    timestamp: pino.stdTimeFunctions.isoTime, // ISO 时间格式
    redact: ["req.headers.authorization", "res.data.token"], // 敏感字段脱敏（生产环境必备）
  };

  // 合并默认配置与自定义配置
  rootLogger = pino({ ...defaultConfig });
  return rootLogger;
};

/**
 * 初始化模块级日志（单例，全局复用）
 * 按业务模块分类，避免日志混乱
 */
export let logger: Logger; // 环境管理模块日志
export let envLogger: Logger; // 环境管理模块日志
export let devServerLogger: Logger; // 开发服务器模块日志
export let proxyLogger: Logger; // 代理模块日志

/**
 * Node.js 日志初始化入口（需在 config 加载后调用）
 */
export const initLoggers = (logLevel: string) => {
  const rootLog = createRootLogger(logLevel);
  // 为每个模块创建子日志（附加 module 标识，便于筛选）
  logger = rootLog.child({ module: "envm" });
  envLogger = rootLog.child({ module: "env" });
  devServerLogger = rootLog.child({ module: "devServer" });
  proxyLogger = rootLog.child({ module: "proxy" });
};

/**
 * 获取根日志实例（确保已初始化）
 */
export const getRootLogger = (): Logger => {
  if (!rootLogger) throw new Error("日志未初始化，请先调用 initNodeLoggers()");
  return rootLogger;
};
