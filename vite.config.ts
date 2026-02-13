import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
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
              'vendor-genai': ['@google/genai'],
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
