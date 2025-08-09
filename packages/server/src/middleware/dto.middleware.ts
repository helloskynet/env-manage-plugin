import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

/**
 * 类型安全的DTO转换中间件
 * 将接入参转换为对应的DTO
 */
export const toDTO = <T>(
  schema: ZodType<T>,
  source: "body" | "params" | "query" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 从指定来源提取原始数据
      const rawData = req[source];

      // 校验并转换数据（ZodType确保类型安全）
      const validatedData = schema.parse(rawData);

      // 将转换后的DTO挂载到req对象
      req.dto = validatedData;

      next();
    } catch (err) {
      // 严格判断Zod错误类型（无any）
      if (err instanceof ZodError) {
        // 格式化Zod错误信息
        const errors = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          code: 400,
          message: errors[0].message || "参数校验失败",
          errors,
        });
      }

      // 处理其他未知错误
      res.status(500).json({
        code: 500,
        message: "服务器内部错误",
      });
    }
  };
};
