import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../server/dist/client',
    emptyOutDir: true, // 强制清空输出目录
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'], // 将vue单独打包
          'element-plus': ['element-plus'], // 将element-plus单独打包
        },
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: false,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false,
    }),
    ElementPlus({}),
    viteCompression({
      algorithm: 'gzip',
      deleteOriginFile: true,
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/dev-manage-api': {
        target: 'http://localhost:3099',
        ws: true,
      },
      '/simple': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/two': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/test': {
        target: 'http://localhost:3099',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 别名映射，确保构建工具能正确解析 shared 源码
      'envm': fileURLToPath(new URL('../types/src', import.meta.url)),
    },
  },
})
