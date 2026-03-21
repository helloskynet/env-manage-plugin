// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * 共享的 ESLint 配置
 * 所有包都应该继承这个基础配置
 */
export const sharedConfig = [
  // 直接展开官方推荐配置，这是扁平配置唯一正确写法
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
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
  },
];
