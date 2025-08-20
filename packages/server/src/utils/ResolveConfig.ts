// config.ts
import { z } from "zod";
import dotenv from "dotenv";
import { EnvmConfigSchema } from "../types/index.js";
import path from "path";
import fs from "fs"

// 1. 加载环境变量
dotenv.config();


// 2. 从package.json读取envm配置
const getPackageJsonConfig = () => {
  try {
    // 寻找项目根目录下的package.json
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);
    
    // 返回envm对象，如果不存在则返回空对象
    return packageJson.envm || {};
  } catch (error) {
    console.warn("⚠️ 无法读取package.json中的envm配置，将忽略这部分配置:", error);
    return {};
  }
};

// 4. 解析环境变量
const parseConfig = () => {
  try {
     // 获取package.json中的配置
    const packageJsonConfig = getPackageJsonConfig();

    console.log(packageJsonConfig,'packageJsonConfig')
    
    // 合并配置：环境变量优先级高于package.json配置
    const mergedConfig = { ...packageJsonConfig, ...process.env };

    const parsed = EnvmConfigSchema.parse(mergedConfig);

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
