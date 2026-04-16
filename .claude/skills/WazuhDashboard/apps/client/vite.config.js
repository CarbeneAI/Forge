import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        strictPort: true,
        host: true,
        allowedHosts: [
            'localhost',
            'localhost',
            'wazuh-dashboard.home.yourdomain.com',
        ],
    },
});
