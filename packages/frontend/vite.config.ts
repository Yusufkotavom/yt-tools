import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 6789,
    host: true,
    allowedHosts: ['ytf.piiblog.net', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:6788',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:6788',
        changeOrigin: true,
      },
    },
  },
});
