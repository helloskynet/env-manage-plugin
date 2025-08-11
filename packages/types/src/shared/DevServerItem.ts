import { z } from 'zod';

/**
 * 开发服务器的 Zod 验证模式
 * 对应 DevServerInterface 接口
 */
export const DevServerSchema = z.object({
  /**
   * 开发服务器的ID
   */
  id: z.string(),

  /**
   * 开发服务器的名称
   */
  name: z.string(),

  /**
   * 开发服务器的描述
   */
  description: z.string().optional().default(''),

  /**
   * 开发服务器的端口（1-65535之间的整数）
   */
  port: z.number().int().min(1).max(65535),

  /**
   * 开发服务器的IP地址
   * 使用简单的IP地址格式验证
   */
  ip: z.string().regex(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/),
});

// 从 Zod 模式生成 TypeScript 类型，与原接口保持一致
export type DevServerInterface = z.infer<typeof DevServerSchema>;
