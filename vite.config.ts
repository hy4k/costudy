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
        rollupOptions: {
          // Multi-entry: main app + standalone exam page
          input: {
            main: path.resolve(__dirname, 'index.html'),
            exam: path.resolve(__dirname, 'exam.html'),
          },
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
            }
          }
        },
        chunkSizeWarningLimit: 600,
        minify: 'esbuild',
        sourcemap: false,
      }
    };
});
