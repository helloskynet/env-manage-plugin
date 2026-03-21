import { z } from "zod";

/**
 * 路由规则主键Schema
 */
export const RouteRulePrimarySchema = z.object({
  id: z.string().describe("主键"),
});

/**
 * 路由规则基础信息Schema
 */
export const RouteRuleBaseSchema = z.object({
  envId: z.string().describe("关联的环境ID"),

  pathPrefix: z
    .string()
    .min(1, "路径前缀不能为空")
    .describe("请求路径前缀，如 /api/user"),

  targetEnvId: z
    .string()
    .optional()
    .describe("目标环境ID（转发到此环境）"),

  targetEnvName: z.string().optional().describe("目标环境名称"),

  description: z.string().optional().describe("描述"),

  enabled: z.boolean().optional().default(true).describe("是否启用"),

  injectScript: z
    .boolean()
    .optional()
    .default(false)
    .describe("是否注入Script脚本"),

  createdAt: z.string().optional(),

  updatedAt: z.string().optional(),
});

/**
 * 完整路由规则模型Schema
 */
export const RouteRuleModelSchema = RouteRulePrimarySchema.extend(
  RouteRuleBaseSchema.shape
);

/**
 * 新增路由规则Schema
 */
export const RouteRuleCreateSchema = RouteRuleBaseSchema.omit({
  createdAt: true,
  updatedAt: true,
});

/**
 * 删除路由规则Schema
 */
export const RouteRuleDeleteSchema = RouteRulePrimarySchema;

/**
 * 修改路由规则Schema
 */
export const RouteRuleUpdateSchema = RouteRulePrimarySchema.extend(
  RouteRuleBaseSchema.partial().shape
);

/**
 * 路由规则主键类型
 */
export type RouteRulePrimary = z.infer<typeof RouteRulePrimarySchema>;

/**
 * 路由规则基础信息类型
 */
export type RouteRuleBase = z.infer<typeof RouteRuleBaseSchema>;

/**
 * 完整路由规则模型类型
 */
export type RouteRuleModel = z.infer<typeof RouteRuleModelSchema>;

/**
 * 新增路由规则参数类型
 */
export type RouteRuleCreate = z.infer<typeof RouteRuleCreateSchema>;

/**
 * 删除路由规则参数类型
 */
export type RouteRuleDelete = z.infer<typeof RouteRuleDeleteSchema>;

/**
 * 修改路由规则参数类型
 */
export type RouteRuleUpdate = z.infer<typeof RouteRuleUpdateSchema>;