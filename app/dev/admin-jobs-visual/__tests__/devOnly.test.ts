import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin-jobs-visual fixture gate', () => {
  it('404s outside local development (never a deployed-build bypass)', () => {
    const src = readFileSync(
      join(__dirname, '..', 'page.tsx'),
      'utf8'
    );
    expect(src).toContain("process.env.NODE_ENV !== 'development'");
    expect(src).toContain('notFound()');
    expect(src).not.toContain("NODE_ENV === 'production'");
  });
});
