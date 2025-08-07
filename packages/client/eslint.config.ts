import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,ts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    rules: {
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: {
            max: 2, // 单行元素最多允许的属性数量
          },
          multiline: {
            max: 1, // 多行元素每行只允许一个属性
          },
        },
      ], // 可选：控制第一个属性的位置
      'vue/first-attribute-linebreak': [
        'error',
        {
          singleline: 'beside', // 单行时第一个属性与标签名同行
          multiline: 'below', // 多行时第一个属性在下一行
        },
      ],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          singleline: 'never', // 单行元素：闭合括号不换行
          multiline: 'always', // 多行元素：闭合括号总是换行
        },
      ],
      'vue/html-indent': [
        'error',
        2,
        {
          attribute: 1,
          baseIndent: 1,
          closeBracket: 0,
          alignAttributesVertically: true,
          ignores: [],
        },
      ],
    },
  },
)
