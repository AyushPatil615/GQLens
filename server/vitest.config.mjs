import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment:  'node',
    include:      ['tests/**/*.test.ts'],
    globalSetup:  ['tests/setup/globalSetup.ts'],
    testTimeout:  15000,
    hookTimeout:  20000,
    reporters:    ['verbose'],
  },
});
