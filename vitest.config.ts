import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // e2e/ belongs to Playwright; vitest must not try to run those specs.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
