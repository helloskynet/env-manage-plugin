import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: '3098',
    proxy: {
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
})
