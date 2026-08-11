import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const here = import.meta.dirname;

export default defineConfig({
  // Served from a project page on GitHub Pages, so every asset URL needs the
  // repository name in front of it.
  base: '/sleep-metrics/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(here, './src') },
  },
});
