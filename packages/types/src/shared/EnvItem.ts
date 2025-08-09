import { z } from "zod";

/**
 * 环境对象的Zod校验规则
 * 用于前后端统一校验环境配置数据
 */
export const EnvItemSchema = z.object({
  /**
   * 环境名称
   * - 非空字符串
   * - 至少1个字符（可根据实际需求调整长度限制）
   */
  name: z.string().min(1, "环境名称不能为空").describe("环境名称"),

  /**
   * 环境描述
   * - 可选字符串
   */
  description: z.string().optional().describe("环境描述"),

  /**
   * 环境绑定端口
   * - 必须是整数
   * - 范围限制在1-65535（有效端口号范围）
   */
  port: z
    .number()
    .int("端口号必须是整数")
    .min(1, "端口号不能小于1")
    .max(65535, "端口号不能大于65535")
    .describe("环境绑定端口"),

  /**
   * 环境绑定的开发服务器ID
   * - 非空字符串（通常是服务器唯一标识）
   */
  devServerId: z
    .string()
    .min(1, "开发服务器ID不能为空")
    .describe("环境绑定的开发服务器ID"),

  /**
   * 环境IP地址
   * - 必须符合IP地址格式（IPv4）
   */
  ip: z
    .string()
    .regex(
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "请输入有效的IPv4地址"
    )
    .describe("环境IP地址"),

  /**
   * 环境首页
   * - 可选字符串
   * - 若提供则需符合URL格式
   */
  homePage: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || /^https?:\/\/.+/.test(value),
      "首页地址必须是有效的URL（以http/https开头）"
    )
    .describe("环境首页"),

  /**
   * 环境状态
   */
  status: z.enum(["running", "stopped"]).default("stopped"),
});

/**
 * 环境对象的类型定义（从Zod schema推导）
 * 前后端可直接导入使用，确保类型一致性
 */
export type EnvItemInterface = z.infer<typeof EnvItemSchema>;
