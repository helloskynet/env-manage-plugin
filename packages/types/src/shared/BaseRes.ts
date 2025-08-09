import { z } from 'zod';

/**
 * 基础响应结构的Zod校验规则
 * 用于统一API返回格式，同时支持前后端类型共享
 */
export const BaseResponseSchema = z.object({
  /**
   * 状态码
   * - 200表示成功
   * - 非200表示异常
   */
  code: z.number(),

  /**
   * 响应消息
   * - 成功时为"success"或相关提示
   * - 失败时为错误描述
   */
  message: z.string(),

  /**
   * 响应数据
   * - 可选字段，根据接口需求动态变化
   * - 类型由泛型参数指定
   */
  data: z.unknown().optional()
});

/**
 * 基础响应类型（从Zod规则推导）
 * 前端可直接导入用于接口响应类型注解
 * 后端可用于类型校验后的结果类型
 */
export type BaseResponse<T = unknown> = z.infer<typeof BaseResponseSchema> & {
  // 扩展泛型支持，使data字段类型可指定
  data?: T;
};

/**
 * 创建带具体数据类型的响应Schema
 * 用于后端校验特定接口的响应格式
 * @param dataSchema 具体数据字段的Zod校验规则
 * @returns 包含具体数据类型的完整响应Schema
 */
export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return BaseResponseSchema.extend({
    data: dataSchema.optional()
  }) as z.ZodObject<{
    code: z.ZodNumber;
    message: z.ZodString;
    data: z.ZodOptional<T>;
  }>;
};
