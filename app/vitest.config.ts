import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts', 'tests/setup/axe-setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@lib': resolve(__dirname, 'src/lib'),
      '@config': resolve(__dirname, 'src/config'),
      '@models': resolve(__dirname, 'src/models'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@storage': resolve(__dirname, 'src/storage'),
      '@registry': resolve(__dirname, 'src/registry'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@workers': resolve(__dirname, 'src/workers'),
      '@data': resolve(__dirname, 'src/data'),
      '@fedplan/models': resolve(__dirname, '../../packages/models/src'),
      '@fedplan/career': resolve(__dirname, '../../packages/career/src'),
      '@fedplan/leave': resolve(__dirname, '../../packages/leave/src'),
      '@fedplan/tsp': resolve(__dirname, '../../packages/tsp/src'),
      '@fedplan/expenses': resolve(__dirname, '../../packages/expenses/src'),
      '@fedplan/tax': resolve(__dirname, '../../packages/tax/src'),
      '@fedplan/military': resolve(__dirname, '../../packages/military/src'),
      '@fedplan/simulation': resolve(__dirname, '../../packages/simulation/src'),
      '@fedplan/validation': resolve(__dirname, '../../packages/validation/src'),
      '@fedplan/utils': resolve(__dirname, '../../packages/utils/src'),
      '@fedplan/ui': resolve(__dirname, '../../packages/ui/src'),
      '@fedplan/core': resolve(__dirname, '../../packages/core/src'),
    },
  },
});
