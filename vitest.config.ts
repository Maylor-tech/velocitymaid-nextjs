import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Mirrors tsconfig.json's "@/*" -> "./*" path alias so tests can import the
 * same way application code does. No config existed before this file —
 * tests previously had to use relative imports (see lib/pricing/__tests__)
 * to work around unresolved "@/" specifiers.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
