import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
// 2. 404 处理中间件：放在所有路由之后
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  // 手动创建一个 404 错误，并传递给错误处理中间件
  const err = new AppError(
    `未找到请求的路由: ${req.method} ${req.originalUrl}`, // 错误信息
    404, // 业务状态码
    404 // HTTP 状态码
  );
  next(err); // 调用 next(err)，触发错误处理中间件
};
