import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: {
    allowedHosts: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  worker: { format: 'iife' },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 }
});
