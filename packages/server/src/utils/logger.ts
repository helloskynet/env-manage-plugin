// 引入 pino

import pino from "pino";

// 创建日志实例（默认输出 JSON 格式，适合生产环境）
const logger = pino({
  level: "info", // 日志级别：只输出 >= 该级别的日志（trace < debug < info < warn < error < fatal）
  base: {
    pid: process.pid, // 进程 ID（默认已包含，可自定义）
    service: "user-service", // 服务名称（便于多服务日志区分）
  },
  timestamp: pino.stdTimeFunctions.isoTime, // 时间格式：ISO 标准时间
});

// 输出不同级别的日志
logger.trace("这是一条 trace 级日志（最详细，默认不输出）");
logger.debug("这是一条 debug 级日志（调试信息）");
logger.info("这是一条 info 级日志（常规运行信息）");
logger.warn("这是一条 warn 级日志（警告信息）");
logger.error(new Error("这是一条 error 级日志（错误信息）")); // 可传入 Error 对象
logger.fatal("这是一条 fatal 级日志（致命错误，会导致程序退出）");
