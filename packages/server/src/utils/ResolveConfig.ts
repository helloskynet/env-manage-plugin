// config.ts
import { z } from "zod";
import dotenv from "dotenv";
import { EnvmConfigSchema, EnvmConfigInterface } from "../types/index.js";
import path from "path";
import fs from "fs";

// 缓存已解析的配置（避免重复加载，实现“单例”效果）
let cachedConfig: EnvmConfigInterface | null = null;

/**
 * 从 package.json 读取 envm 配置（支持自定义路径）
 */
const getPackageJsonConfig = () => {
  const defaultPath = path.resolve(process.cwd(), "package.json");
  const targetPath = defaultPath;

  try {
    const content = fs.readFileSync(targetPath, "utf8");
    const pkg = JSON.parse(content);
    return pkg.envm || {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.warn(
      `⚠️ 无法读取 package.json（路径：${targetPath}）中的 envm 配置，将忽略这部分配置:`
    );
    return {};
  }
};

/**
 * 加载并解析配置（核心函数）
 * @param options 动态配置参数（如自定义 .env 路径）
 * @returns 验证后的配置对象
 */
export const loadConfig = (
  overrideConfig?: Partial<EnvmConfigInterface>
): EnvmConfigInterface => {
  // 1. 单例保护：已加载过则直接返回缓存，避免重复IO和解析
  if (cachedConfig) return cachedConfig;

  try {
    // 2. 加载 .env 文件（支持自定义路径）
    const dotenvResult = dotenv.config();
    if (dotenvResult.error) {
      console.warn("⚠️ 未找到 .env 文件，忽略...");
    }

    // 3. 读取 package.json 配置（支持自定义路径）
    const packageJsonConfig = getPackageJsonConfig();

    // 4. 合并配置：环境变量优先级 > package.json 配置
    // 3. 合并配置：优先级从低到高
    const mergedConfig = {
      ...packageJsonConfig, // 最低优先级
      ...process.env, // 中间优先级
      ...overrideConfig, // 最高优先级（外部传入的配置）
    };
    // 5. Zod 验证
    const parsedConfig = EnvmConfigSchema.parse(mergedConfig);

    // 6. 缓存配置并返回
    cachedConfig = parsedConfig;
    console.log("✅ 配置加载与验证成功");
    return parsedConfig;
  } catch (error) {
    // 7. 精细化错误处理
    if (error instanceof z.ZodError) {
      console.error("❌ 配置验证失败（字段错误详情）:", error.issues);
      throw new Error(
        `配置字段错误：${error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`
      );
    }
    console.error("❌ 配置加载失败:", error);
    throw new Error(`配置加载异常：${(error as Error).message}`);
  }
};

/**
 * 获取已加载的配置（需在 loadConfig() 后调用）
 * @returns 缓存的配置对象
 */
export const getConfig = (): EnvmConfigInterface => {
  if (!cachedConfig) throw new Error("配置未加载，请先调用 loadConfig()");
  return cachedConfig;
};
