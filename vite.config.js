import { defineConfig } from 'vite';
import path from 'path';

// Heuristics: enable per-package vendor splitting for client builds. SSR uses simpler, larger chunks.
const DEFAULT_VENDOR_SPLIT = true;

function getPkgNameFromId(id) {
    if (!id) return null;
    const parts = id.split('/node_modules/').pop().split('/');
    // Scoped packages like @scope/name
    if (parts[0].startsWith('@') && parts[1]) {
        return `${parts[0]}/${parts[1]}`;
    }
    return parts[0];
}

export default defineConfig(({ command, mode, ssrBuild }) => ({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment'
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
  build: {
    minify: true,
    rollupOptions: {
      output: {
            // consistent names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
            if (!id) return null;
          const normalized = id.replace(/\\/g, '/');

            // SSR builds: keep simple splits (smaller surface for server bundle)
            if (ssrBuild) {
                if (normalized.includes('/src/velocity/') || /\/src\/velocity$/.test(normalized)) return 'velocity-ssr';
                if (normalized.includes('/src/') && !normalized.includes('/src/velocity/')) return 'app-ssr';
                if (normalized.includes('/node_modules/')) return 'vendor-ssr';
                return null;
            }

            // Client builds: prefer per-package vendor splitting for long-term caching
            if (normalized.includes('/src/velocity/') || /\/src\/velocity$/.test(normalized)) {
                return 'velocity';
          }

            if (normalized.includes('/src/') && !normalized.includes('/src/velocity/')) {
            return 'app';
          }

          if (normalized.includes('/node_modules/')) {
              const vendorSplit = process.env.VENDOR_SPLIT !== 'false' ? DEFAULT_VENDOR_SPLIT : false;
              if (vendorSplit) {
                  const pkg = getPkgNameFromId(normalized);
                  if (pkg) {
                      // sanitize name for filesystem
                      const safe = pkg.replace(/[^a-z0-9_\-\.]/gi, '-');
                      return `vendor.${safe}`;
                  }
              }
            return 'vendor';
          }

          return null;
        }
      }
    }
  }
}));
