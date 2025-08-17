import { z } from 'zod';

/**
 * 开发服务器主键Schema
 * 用于标识开发服务器的唯一ID
 */
export const DevServerPrimarySchema = z.object({
  id: z.string().describe("主键"),
});

/**
 * 开发服务器基础信息Schema
 * 包含开发服务器的基本配置信息
 */
export const BaseDevServerSchema = z.object({
  /**
   * 开发服务器的名称
   */
  name: z.string().describe("开发服务器名称"),

  /**
   * 开发服务器的描述
   */
  description: z.string().optional().default("").describe("开发服务器描述"),

  /**
   * 开发服务器的IP地址或URL
   */
  devServerUrl: z.string().describe("开发服务器地址"),
});

/**
 * 完整开发服务器模型Schema
 * 合并了主键和基础信息，用于创建完整的开发服务器模型
 */
export const DevServerModelSchema = DevServerPrimarySchema.extend(BaseDevServerSchema.shape);

/**
 * 新增开发服务器Schema
 * 用于创建新开发服务器时的参数验证，不需要提供id（由系统生成）
 */
export const DevServerCreateSchema = BaseDevServerSchema;

/**
 * 删除 开发服务器Schema
 * 用于删除开发服务器时的参数验证，只需要提供开发服务器id
 */
export const DevServerDeleteSchema = DevServerPrimarySchema;

/**
 * 修改开发服务器Schema
 * 用于更新开发服务器信息时的参数验证，id为必填项，其他字段可选
 */
export const DevServerUpdateSchema = DevServerPrimarySchema.extend(
  BaseDevServerSchema.partial().shape
);

/**
 * 查询开发服务器Schema
 * 用于查询开发服务器信息时的参数验证，只需要提供开发服务器id
 */
export const DevServerQuerySchema = DevServerPrimarySchema;

/**
 * 开发服务器主键类型
 * 包含开发服务器的唯一标识id
 */
export type DevServerPrimary = z.infer<typeof DevServerPrimarySchema>;

/**
 * 开发服务器基础信息类型
 * 包含开发服务器的所有配置字段
 */
export type BaseDevServer = z.infer<typeof BaseDevServerSchema>;

/**
 * 完整开发服务器模型类型
 * 包含开发服务器的所有信息（主键+基础信息）
 */
export type DevServerModel = z.infer<typeof DevServerModelSchema>;

/**
 * 新增开发服务器参数类型
 * 用于创建新开发服务器时的参数类型，不包含id字段
 */
export type DevServerCreate = z.infer<typeof DevServerCreateSchema>;

/**
 * 删除开发服务器参数类型
 * 用于删除开发服务器时的参数类型，只包含id字段
 */
export type DevServerDelete = z.infer<typeof DevServerDeleteSchema>;

/**
 * 修改开发服务器参数类型
 * 用于更新开发服务器时的参数类型，id为必填项，其他字段可选
 */
export type DevServerUpdate = z.infer<typeof DevServerUpdateSchema>;

/**
 * 查询开发服务器参数类型
 * 用于查询开发服务器时的参数类型，只包含id字段
 */
export type DevServerQuery = z.infer<typeof DevServerQuerySchema>;
    