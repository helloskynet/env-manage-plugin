// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * 共享的 ESLint 配置
 * 所有包都应该继承这个基础配置
 */
export const sharedConfig = tseslint.config(
  // ESLint 推荐规则
  eslint.configs.recommended,
  // typescript-eslint 推荐规则
  tseslint.configs.recommended,

  // 通用 ignores
  {
    ignores: [
      "**/dist/**",
      "**/dist-ssr/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/*.min.js",
      "**/pnpm-lock.yaml",
    ],
  }
);
