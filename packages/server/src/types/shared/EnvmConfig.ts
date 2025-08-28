import { z } from "zod";

// 2. 定义环境变量模式
export const EnvmConfigSchema = z.object({
  port: z.coerce
    .number()
    .min(3000, { message: "端口必须大于等于3000" })
    .max(65535, { message: "端口必须小于等于65535" })
    .default(3099), // 自动转换类型
  apiPrefix: z.string().default("/dev-manage-api"),
  cookieSuffix: z.string().default("envm"), // 新增 cookie 后缀配置
  logLevel: z.string().default("info"),
});

// 3. 创建配置接口
export type EnvmConfigInterface = z.infer<typeof EnvmConfigSchema>;
