// config.ts
import { z } from "zod";
import dotenv from "dotenv";

// 1. 加载环境变量
dotenv.config();

// 2. 定义环境变量模式
const EnvSchema = z.object({
  PORT: z.coerce.number().default(3099), // 自动转换类型
  API_PREFIX: z.string().default("/dev-manage-api"),
  COOKIE_PROXY: z.coerce.boolean().default(true), // 支持 true/false/1/0
  STORAGE_MODE: z.enum(["file", "database"]).default("file"),
  COOKIE_SUFFIX: z.string().default("envm"), // 新增 cookie 后缀配置
});

// 3. 创建配置接口
export interface ConfigModel {
  port: number;
  apiPrefix: string;
  cookieProxy: boolean;
  storageMode: "file" | "database";
  cookieSuffix: string; // 新增 cookie 后缀配置
}

// 4. 解析环境变量
const parseConfig = (): ConfigModel => {
  try {
    const parsed = EnvSchema.parse(process.env);
    
    return {
      port: parsed.PORT,
      apiPrefix: parsed.API_PREFIX,
      cookieProxy: parsed.COOKIE_PROXY,
      storageMode: parsed.STORAGE_MODE,
      cookieSuffix: parsed.COOKIE_SUFFIX,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ 环境变量配置错误:", error);
    }
    throw new Error("环境变量验证失败");
  }
};

// 5. 导出配置实例
export const config = parseConfig();