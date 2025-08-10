import { z } from "zod";
import { PartialExcept } from "./Utils";

/**
 * 基类：环境对象的主键信息（用于删除、查询等操作）
 * 包含唯一标识环境的 ip 和 port
 */
export const EnvBaseSchema = z.object({
  // 主键字段：ip（复用之前的校验规则）
  ip: z
    .string()
    .regex(
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "请输入有效的IPv4地址"
    )
    .describe("环境IP地址（主键）"),

  // 主键字段：port（复用之前的校验规则）
  port: z
    .number()
    .int("端口号必须是整数")
    .min(1, "端口号不能小于1")
    .max(65535, "端口号不能大于65535")
    .describe("环境绑定端口（主键）"),
});

/**
 * 基类类型：环境对象的主键信息
 */
export type EnvBaseInterface = z.infer<typeof EnvBaseSchema>;

/**
 * 环境对象的Zod校验规则
 * 用于前后端统一校验环境配置数据
 */
export const EnvItemSchema = EnvBaseSchema.extend({
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
   * 环境绑定的开发服务器ID
   * - 非空字符串（通常是服务器唯一标识）
   */
  devServerId: z
    .string()
    .min(1, "开发服务器ID不能为空")
    .describe("环境绑定的开发服务器ID"),

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

/**
 * 环境对象的部分更新类型
 * - 基础属性（ip 和 port）保持必选（作为查询条件）
 * - 其他扩展属性均为可选（支持部分更新）
 */
export type EnvItemPartial = PartialExcept<EnvItemInterface, keyof EnvBaseInterface>;
