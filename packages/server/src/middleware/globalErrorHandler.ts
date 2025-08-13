import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

/**
 * 全局错误处理中间件
 *
 * 统一捕获并处理应用中抛出的所有错误（包括自定义错误和系统错误），
 * 通过响应增强器提供的 res.error() 方法返回标准化错误响应。
 *
 * @param {Error} err - 捕获到的错误对象，可能是自定义错误或系统原生错误
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象（已通过 responseEnhancer 增强，包含 error 方法）
 * @returns {void} 无返回值，直接通过 res.error() 发送响应
 *
 * @example
 * // 在 Express 应用中注册
 * app.use(globalErrorHandler);
 *
 * @example
 * // 抛出错误时会被此中间件捕获
 * throw new AppError('资源未找到', 404, 10001);
 */

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 初始化响应信息
  let code: number;
  let message: string;
  let status: number = 0;

  // 处理自定义错误（业务已知错误）
  if (err instanceof AppError) {
    code = err.code;
    message = err.message;
    status = err.status;
  } else {
    // 处理系统错误（如TypeError、ReferenceError等未知错误）
    console.error("系统错误详情:", err); // 记录详细错误日志用于排查
    code = 500; // 业务状态码：服务器内部错误
    message = "服务器内部错误"; // 对用户展示的友好信息（避免暴露敏感信息）
  }

  // 使用增强的响应方法发送标准化错误响应
  res.error(message, code, { status });
};
