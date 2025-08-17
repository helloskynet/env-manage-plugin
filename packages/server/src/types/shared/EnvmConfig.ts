import { z } from 'zod';

// 2. 定义环境变量模式
export const EnvmConfigSchema = z.object({
  port: z.coerce.number().default(3099), // 自动转换类型
  apiPrefix: z.string().default("/dev-manage-api"),
  cookieProxy: z.coerce.boolean().default(true), // 支持 true/false/1/0
  storageMode: z.enum(["file", "database"]).default("file"),
  cookieSuffix: z.string().default("envm"), // 新增 cookie 后缀配置
  logLevel: z.string().default("info"),
});

// 3. 创建配置接口
export type EnvmConfigInterface = z.infer<typeof EnvmConfigSchema>;