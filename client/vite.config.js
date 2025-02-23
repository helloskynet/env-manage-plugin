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
    outDir: '../src/client',
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
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ElementPlus(),
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
      },
      '/simple': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/two': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
