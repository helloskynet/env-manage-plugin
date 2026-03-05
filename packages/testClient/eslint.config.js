import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  // 基础配置
  js.configs.recommended,
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  // Vue 相关配置
  ...pluginVue.configs['flat/essential'],

  // oxlint 配置
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // 关闭格式化相关规则（由 prettier 处理）
  skipFormatting,
])