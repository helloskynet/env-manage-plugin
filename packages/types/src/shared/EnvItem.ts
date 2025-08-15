import { z } from "zod";
import { PartialExcept } from "./Utils";

/**
 * 基类：环境对象的主键信息（仅ip作为主键）
 */
export const EnvBaseSchema = z.object({
  apiBaseUrl: z.string().describe("环境IP地址（主键）"),
});

export type EnvBaseInterface = z.infer<typeof EnvBaseSchema>;

/**
 * 基础结构schema（不包含transform）
 * 用于后续构建UpdateEnvSchema
 */
export const EnvItemBaseSchema = EnvBaseSchema.extend({
  port: z
    .number()
    .int("端口号必须是整数")
    .min(1, "端口号不能小于1")
    .max(65535, "端口号不能大于65535")
    .describe("环境绑定端口（必填）"),

  name: z
    .string()
    .describe("环境名称")
    .optional(),

  description: z.string().optional().describe("环境描述"),

  devServerId: z
    .string()
    .min(1, "开发服务器ID不能为空")
    .optional()
    .describe("环境绑定的开发服务器ID"),

  homePage: z.string().optional().describe("环境首页"),

  status: z.enum(["running", "stopped"]).optional(),
});

/**
 * 带transform的完整schema（用于创建环境）
 * 处理name字段的默认值逻辑
 */
export const EnvItemSchema = EnvItemBaseSchema.transform(data => ({
  ...data,
  name: data.name ?? data.apiBaseUrl,
  homePage: data.homePage ?? '/'
}));

/**
 * 环境对象的类型定义
 */
export type EnvItemInterface = z.infer<typeof EnvItemSchema>;

export type EnvItemPartial = PartialExcept<
  EnvItemInterface,
  keyof EnvBaseInterface
>;

/**
 * 修复更新schema：基于基础schema而非带transform的schema
 * 避免ZodPipe类型不支持partial()的问题
 */
export const UpdateEnvSchema = EnvItemBaseSchema
  .partial() // 现在可以正常调用partial()了
  .extend(EnvBaseSchema.shape) // 确保主键ip仍然是必填的
  .strict()
  // 为更新操作也添加name的默认值处理
  .transform(data => ({
    ...data,
    name: data.name ?? data.apiBaseUrl
  }));

export type UpdateEnvInterface = z.infer<typeof UpdateEnvSchema>;
    