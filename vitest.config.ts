import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['@google/generative-ai'],
      },
    },
    alias: {
      '@': resolve(__dirname, './src'),
      'server-only': resolve(__dirname, './src/server-actions/__mocks__/server-only.ts'),
    }
  },
});
