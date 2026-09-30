import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8080,
    strictPort: false,  // 端口被占用自动切换
    host: '0.0.0.0'     // 允许局域网访问
  }
})