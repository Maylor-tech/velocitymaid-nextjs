import { describe, expect, it } from 'vitest';
import {
  collectChangedSourceFiles,
  evaluateChangedFileQuality,
  parseEslintJson,
  parseTscOutput,
} from '../check-changed-file-quality.mjs';

describe('changed-file quality ratchet', () => {
  it('collects only existing ts/tsx files', () => {
    const files = collectChangedSourceFiles(
      ['lib/auth/requireAuth.ts', 'README.md', 'lib/missing.ts', 'app/page.tsx'],
      { exists: (file) => file === 'lib/auth/requireAuth.ts' || file === 'app/page.tsx' }
    );
    expect(files).toEqual(['lib/auth/requireAuth.ts', 'app/page.tsx']);
  });

  it('passes when a changed file has no diagnostics', () => {
    const result = evaluateChangedFileQuality({
      changedFiles: ['lib/auth/requireAuth.ts'],
      diagnostics: [],
    });
    expect(result.ok).toBe(true);
    expect(result.hits).toEqual([]);
  });

  it('fails when a changed file has a new TypeScript error', () => {
    const ts = parseTscOutput(
      "lib/auth/requireAuth.ts(10,5): error TS2339: Property 'tenantId' does not exist."
    );
    const result = evaluateChangedFileQuality({
      changedFiles: ['lib/auth/requireAuth.ts'],
      diagnostics: ts,
    });
    expect(result.ok).toBe(false);
    expect(result.hits[0].code).toBe('TS2339');
  });

  it('fails when a changed file has a new ESLint error', () => {
    const lint = parseEslintJson(
      JSON.stringify([
        {
          filePath: 'lib/audit.ts',
          messages: [
            {
              severity: 2,
              line: 18,
              column: 13,
              ruleId: '@typescript-eslint/no-explicit-any',
              message: 'Unexpected any.',
            },
          ],
        },
      ])
    );
    const result = evaluateChangedFileQuality({
      changedFiles: ['lib/audit.ts'],
      diagnostics: lint,
    });
    expect(result.ok).toBe(false);
    expect(result.hits[0].source).toBe('eslint');
  });

  it('ignores an unchanged legacy error outside changed files', () => {
    const result = evaluateChangedFileQuality({
      changedFiles: ['lib/auth/requireAuth.ts'],
      diagnostics: [
        {
          file: 'lib/pricing/lock.ts',
          line: 30,
          column: 15,
          code: 'TS2339',
          message: 'Property priceLockedAt does not exist.',
          source: 'typescript',
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('fails when a changed legacy file still has unresolved errors', () => {
    const result = evaluateChangedFileQuality({
      changedFiles: ['lib/pricing/lock.ts'],
      diagnostics: [
        {
          file: 'lib/pricing/lock.ts',
          line: 30,
          column: 15,
          code: 'TS2339',
          message: 'Property priceLockedAt does not exist.',
          source: 'typescript',
        },
      ],
    });
    expect(result.ok).toBe(false);
  });
});
