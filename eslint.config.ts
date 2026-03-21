// @ts-check
import json from "@eslint/json";
import { sharedConfig } from "./eslint.config.shared";

export default [
  ...sharedConfig,
  {
    files: ["**/*.json"],
    language: "json/json",
    ...json.configs.recommended,
    rules: {
      "no-irregular-whitespace": "off",
    },
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
  },
];
