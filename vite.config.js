import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from "vite-plugin-mkcert"

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), mkcert()],
  server: {
    host: '0.0.0.0',  // 允许外部设备访问
    port: 5174,       // 设置端口号
    cors: true,        // 启用 CORS 支持，允许跨域请求
    strictPort: true,  // 如果端口已被占用，确保报错而不是自动更换端口
  }
})