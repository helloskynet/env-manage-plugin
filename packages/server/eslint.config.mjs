// @ts-check
import json from "@eslint/json";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["src/**/*.{ts,mts,cts}"],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    rules: {},
  },
  {
    files: ["src/**/*.{js,mjs,cjs}"],
    extends: [eslint.configs.recommended],
    rules: {},
  },
  {
    files: ["**/*.json"],
    ignores: ["**/package-lock.json"],
    language: "json/json",
    ...json.configs.recommended,
  }
);
