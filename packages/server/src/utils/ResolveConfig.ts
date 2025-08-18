// config.ts
import { z } from "zod";
import dotenv from "dotenv";
import { EnvmConfigSchema } from "../types/index.js";

// 1. 加载环境变量
dotenv.config();

// 4. 解析环境变量
const parseConfig = () => {
  try {
    const parsed = EnvmConfigSchema.parse(process.env);

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ 环境变量配置错误:", error);
    }
    throw new Error("环境变量验证失败");
  }
};

// 5. 导出配置实例
export const config = parseConfig();
