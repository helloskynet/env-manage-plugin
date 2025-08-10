import { NextFunction, Request, Response } from "express";

/**
 * 响应增强中间件
 * 
 * 为 Express 的 Response 对象添加统一格式的 success 和 error 响应方法，
 * 确保 API 返回数据结构一致，包含状态码、消息、数据和时间戳。
 * 
 * @param {Request} req - Express 请求对象
 * @param {Response} res - Express 响应对象
 * @param {NextFunction} next - Express 下一步中间件函数
 * @returns {void}
 */
export const responseEnhancer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  /**
   * 发送成功响应
   * 
   * @template T - 响应数据的类型
   * @param {T} [data] - 成功响应的数据 payload，可为任意类型
   * @param {string} [message="操作成功"] - 成功提示消息
   * @param {number} [code=200] - HTTP 状态码，默认 200
   * @returns {Response} Express 响应对象，支持链式调用
   * @example
   * res.success({ id: 1, name: '示例' }, '获取成功', 200);
   */
  res.success = function <T = unknown>(data?: T, message = "操作成功", code = 200) {
    return res.status(code).json({
      code,
      message,
      data,
      timestamp: Date.now(),
    });
  };

  /**
   * 发送错误响应
   * 
   * @template T - 错误附加数据的类型
   * @param {string} [message="操作失败"] - 错误提示消息
   * @param {number} [code=500] - HTTP 状态码，默认 500
   * @param {T} [data] - 错误相关的附加数据，可为任意类型
   * @returns {Response} Express 响应对象，支持链式调用
   * @example
   * res.error('参数错误', 400, { invalidFields: ['name'] });
   */
  res.error = function <T = unknown>(message = "操作失败", code = 500, data?: T) {
    return res.status(code).json({
      code,
      message,
      data,
      timestamp: Date.now(),
    });
  };

  next();
};
    