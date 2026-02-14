import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.js'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'playwright/**',
      'functions/node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.js',
        '**/*.config.mjs',
        'scripts/',
        'src/env.d.ts'
      ]
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: '/public/js' },
      { find: '@mcp', replacement: path.join(process.env.HOME, 'mcp-servers/planning-game') },
      { find: /^\/firebase-config\.js$/, replacement: path.join(rootDir, 'tests/mocks/firebase-config.js') },
      { find: 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm', replacement: path.join(rootDir, 'tests/mocks/lit.js') }
    ]
  }
});
