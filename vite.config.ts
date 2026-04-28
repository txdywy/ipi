import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.claude/**',
      '.omc/**',
      '.planning/**',
      '.playwright-mcp/**',
      '.worktrees/**',
    ],
  },
})
