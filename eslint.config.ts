// @ts-check
import json from "@eslint/json";
import tseslint from "typescript-eslint";
import { sharedConfig } from "./eslint.config.shared";

export default tseslint.config(
  ...sharedConfig,
  {
    files: ["**/*.json"],
    language: "json/json",
    ...json.configs.recommended,
  },
  // 根目录特定配置
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);