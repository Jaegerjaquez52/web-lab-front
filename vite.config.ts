import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === 'analyze'
      ? [visualizer({ filename: 'dist/bundle-report.html', open: false, gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    target: 'es2022',
    minify: true,
    cssMinify: true,
    sourcemap: false,
  },
  test: { include: ['src/**/*.test.ts'] },
}));