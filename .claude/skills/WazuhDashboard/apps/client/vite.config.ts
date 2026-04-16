import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      // Add your host IP and domain here, e.g.:
      // '192.168.1.10',
      // 'wazuh-dashboard.home.yourdomain.com',
    ],
  },
})
