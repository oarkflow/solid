import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
  },
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});