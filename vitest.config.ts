import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react() as unknown as never],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'libs/breathing-*.ts',
        'hooks/use-breathing-timer.ts',
        'app/(pages)/r3f/breathing/**/*.{ts,tsx}',
        'webgl/components/breathing-visualizer/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/*.module.css',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),
    },
  },
})
