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
      // '10.0.0.10',
      // 'wazuh-dashboard.home.yourdomain.com',
    ],
  },
})
