import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    // Keep vitest's defaults (node_modules, dist, …) and skip other git
    // worktrees and build/tool output that live inside the repo.
    exclude: [
      ...configDefaults.exclude,
      '.claude/**',
      '.open-next/**',
      '.wrangler/**',
      '.superpowers/**',
    ],
  },
});
