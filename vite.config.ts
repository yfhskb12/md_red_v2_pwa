
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base: "./"' ensures that all asset paths (JS, CSS, images) are generated 
  // with a leading "./", making them explicitly relative to the current index.html location.
  // This guarantees the app works regardless of the deployment subpath (e.g. /my-repo/).
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps for production to prevent code leakage
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: true,
  },
});
