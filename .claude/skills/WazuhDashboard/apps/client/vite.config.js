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
            '192.168.2.81',
            'wazuh-dashboard.home.carbeneai.com',
        ],
    },
});
