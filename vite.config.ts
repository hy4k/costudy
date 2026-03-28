import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Code splitting for better caching and faster initial load
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks - separate heavy dependencies
              'vendor-react': ['react', 'react-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
            }
          }
        },
        // Increase warning limit since we're handling it
        chunkSizeWarningLimit: 600,
        // Enable minification optimizations (esbuild is built-in and faster)
        minify: 'esbuild',
        // Enable source maps for debugging (optional, remove for smaller builds)
        sourcemap: false,
      }
    };
});
