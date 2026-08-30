import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    // Same-origin `/api` in dev and in the nginx image, so no CORS special-casing
    // and no environment-dependent base URL in the client code.
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  preview: { host: true, port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
});
