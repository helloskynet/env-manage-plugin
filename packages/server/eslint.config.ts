// @ts-check
import { sharedConfig } from "../../eslint.config.shared";

export default [
  ...sharedConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Server 特定规则
  {
    rules: {
      // Node.js 环境特定规则
      "@stylistic/no-tabs": "off",
      // 允许 __dirname 和 __filename
      "no-restricted-globals": "off",
    },
  },
];
