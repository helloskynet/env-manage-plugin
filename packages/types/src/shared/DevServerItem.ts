import { z } from "zod";

/**
 * 开发服务器的 Zod 验证模式
 * 对应 DevServerInterface 接口
 */
export const BaseDevServerSchema = z.object({
  /**
   * 开发服务器的名称
   */
  name: z.string(),

  /**
   * 开发服务器的描述
   */
  description: z.string().optional().default(""),

  /**
   * 开发服务器的IP地址
   * 使用简单的IP地址格式验证
   */
  devServerUrl: z.string(),
});

/**
 * 创建开发服务器的验证模式
 * 不需要额外字段，直接使用基础模式
 */
export const DevServerSchema = BaseDevServerSchema;
/**
 * 创建开发服务器的验证模式
 * 自动根据ip和port生成id
 */
export const CreateDevServerSchema = DevServerSchema;

/**
 * 更新开发服务器的验证模式
 * 所有字段可选，但必须提供主键(ip+port)
 */
export const UpdateDevServerSchema = BaseDevServerSchema.partial().extend({
  devServerUrl: BaseDevServerSchema.shape.devServerUrl,
});

/**
 * 删除开发服务器的验证模式
 * 只需要主键(ip+port)
 */
export const DeleteDevServerSchema = z.object({
  devServerUrl: BaseDevServerSchema.shape.devServerUrl,
});

/**
 * 查询开发服务器的验证模式
 * 所有字段可选，用于过滤查询
 */
export const QueryDevServerSchema = BaseDevServerSchema.partial();

// 从Zod模式生成对应的TypeScript类型
export type CreateDevServerInterface = z.infer<typeof CreateDevServerSchema>;
export type UpdateDevServerInterface = z.infer<typeof UpdateDevServerSchema>;
export type DeleteDevServerInterface = z.infer<typeof DeleteDevServerSchema>;
export type QueryDevServerInterface = z.infer<typeof QueryDevServerSchema>;

// 从 Zod 模式生成 TypeScript 类型，与原接口保持一致
export type DevServerInterface = z.infer<typeof DevServerSchema>;
