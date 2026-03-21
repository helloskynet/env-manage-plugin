import { z } from "zod";

/**
 * 密码主键Schema
 */
export const PasswordPrimarySchema = z.object({
  id: z.string().describe("主键"),
});

/**
 * 密码基础信息Schema
 */
export const PasswordBaseSchema = z.object({
  envId: z.string().describe("关联的环境ID"),

  name: z
    .string()
    .min(1, "名称不能为空")
    .describe("密码名称（如：数据库、API密钥等）"),

  username: z
    .string()
    .min(1, "用户名不能为空")
    .describe("用户名"),

  password: z
    .string()
    .min(1, "密码不能为空")
    .describe("密码"),

  description: z.string().optional().describe("描述"),

  isDefault: z.boolean().optional().default(false).describe("是否为默认密码"),

  createdAt: z.string().optional(),

  updatedAt: z.string().optional(),
});

/**
 * 完整密码模型Schema
 */
export const PasswordModelSchema = PasswordPrimarySchema.extend(
  PasswordBaseSchema.shape
);

/**
 * 新增密码Schema
 */
export const PasswordCreateSchema = PasswordBaseSchema.omit({
  createdAt: true,
  updatedAt: true,
});

/**
 * 删除密码Schema
 */
export const PasswordDeleteSchema = PasswordPrimarySchema;

/**
 * 修改密码Schema
 */
export const PasswordUpdateSchema = PasswordPrimarySchema.extend(
  PasswordBaseSchema.partial().shape
);

/**
 * 密码主键类型
 */
export type PasswordPrimary = z.infer<typeof PasswordPrimarySchema>;

/**
 * 密码基础信息类型
 */
export type PasswordBase = z.infer<typeof PasswordBaseSchema>;

/**
 * 完整密码模型类型
 */
export type PasswordModel = z.infer<typeof PasswordModelSchema>;

/**
 * 新增密码参数类型
 */
export type PasswordCreate = z.infer<typeof PasswordCreateSchema>;

/**
 * 删除密码参数类型
 */
export type PasswordDelete = z.infer<typeof PasswordDeleteSchema>;

/**
 * 修改密码参数类型
 */
export type PasswordUpdate = z.infer<typeof PasswordUpdateSchema>;