import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../src/client',
    emptyOutDir: true, // 强制清空输出目录
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/dev-manage-api': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/simple': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      },
      '/two': {
        target: 'http://localhost:3099',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
