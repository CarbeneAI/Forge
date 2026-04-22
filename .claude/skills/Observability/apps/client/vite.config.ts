import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5172,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      // Add your host IP and domain here, e.g.:
      // '10.0.0.10',
      // 'observability.home.yourdomain.com',
    ],
  },
})
