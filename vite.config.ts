import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guidelines: resolve(__dirname, 'guidelines.html'),
        journalQuality: resolve(__dirname, 'journal-quality-analyzer.html'),
        radar: resolve(__dirname, 'guideline-radar/radar.html'),
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 3000,
    open: true,
  },
});
