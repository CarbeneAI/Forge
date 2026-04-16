import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      // Add your domain here, e.g.: 'n8n-dashboard.home.yourdomain.com',
    ],
  },
});
