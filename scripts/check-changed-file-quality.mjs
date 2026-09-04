#!/usr/bin/env node
/**
 * Changed-file quality ratchet.
 *
 * Compares the working tree / branch against a base ref (default origin/main),
 * then fails only when changed .ts/.tsx files still contain TypeScript or
 * ESLint errors. Untouched legacy debt is ignored.
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function normalizePath(file) {
  return String(file || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

export function isSourceFile(file) {
  const normalized = normalizePath(file);
  return /\.(ts|tsx)$/.test(normalized) && !normalized.endsWith('.d.ts');
}

export function collectChangedSourceFiles(names, { exists = existsSync } = {}) {
  const unique = [];
  const seen = new Set();
  for (const name of names) {
    const normalized = normalizePath(name);
    if (!isSourceFile(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    if (exists(normalized) || exists(path.resolve(normalized))) {
      unique.push(normalized);
    }
  }
  return unique;
}

export function parseTscOutput(output) {
  const diagnostics = [];
  for (const line of String(output || '').split(/\r?\n/)) {
    const match = line.match(/^(.*?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/);
    if (!match) continue;
    diagnostics.push({
      file: normalizePath(match[1]),
      line: Number(match[2]),
      column: Number(match[3]),
      code: match[4],
      message: match[5],
      source: 'typescript',
    });
  }
  return diagnostics;
}

export function parseEslintJson(output) {
  const diagnostics = [];
  let parsed;
  try {
    parsed = JSON.parse(String(output || '[]'));
  } catch {
    return diagnostics;
  }
  if (!Array.isArray(parsed)) return diagnostics;
  for (const result of parsed) {
    const file = normalizePath(result.filePath || '');
    for (const msg of result.messages || []) {
      if (msg.severity !== 2) continue;
      diagnostics.push({
        file,
        line: msg.line || 0,
        column: msg.column || 0,
        code: msg.ruleId || 'eslint',
        message: msg.message || 'ESLint error',
        source: 'eslint',
      });
    }
  }
  return diagnostics;
}

export function evaluateChangedFileQuality({ changedFiles, diagnostics }) {
  const changed = new Set((changedFiles || []).map(normalizePath));
  const hits = (diagnostics || []).filter((diag) => {
    const file = normalizePath(diag.file);
    if (changed.has(file)) return true;
    for (const changedFile of changed) {
      if (file.endsWith(`/${changedFile}`) || file.endsWith(changedFile)) return true;
    }
    return false;
  });
  return { ok: hits.length === 0, hits };
}

function gitLines(command) {
  try {
    const out = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function listChangedFiles(baseRef = 'origin/main') {
  const names = [
    ...gitLines(`git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`),
    ...gitLines(`git diff --name-only --diff-filter=ACMR ${baseRef}`),
    ...gitLines('git diff --name-only --diff-filter=ACMR --cached'),
    ...gitLines('git ls-files --others --exclude-standard'),
  ];
  return collectChangedSourceFiles(names);
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  return `${result.stdout || ''}${result.stderr || ''}`;
}

/**
 * @param {{
 *   baseRef?: string,
 *   changedFiles?: string[],
 *   tscOutput?: string,
 *   eslintOutput?: string,
 *   skipTools?: boolean,
 * }} [opts]
 */
export async function runQualityCheck({
  baseRef = process.env.QUALITY_BASE || 'origin/main',
  changedFiles,
  tscOutput,
  eslintOutput,
  skipTools = process.env.QUALITY_SKIP_TOOLS === '1',
} = {}) {
  const files = changedFiles || listChangedFiles(baseRef);
  if (files.length === 0) {
    return { ok: true, hits: [], changedFiles: [], skipped: 'no-changed-ts' };
  }

  let tsDiagnostics = [];
  let lintDiagnostics = [];

  if (!skipTools) {
    const tscText =
      tscOutput ??
      runCommand('npx', ['tsc', '--noEmit', '--pretty', 'false']);
    tsDiagnostics = parseTscOutput(tscText);

    const eslintText =
      eslintOutput ??
      runCommand('npx', [
        'eslint',
        '--no-error-on-unmatched-pattern',
        '-f',
        'json',
        ...files,
      ]);
    lintDiagnostics = parseEslintJson(eslintText);
  } else {
    tsDiagnostics = parseTscOutput(tscOutput || '');
    lintDiagnostics = parseEslintJson(eslintOutput || '[]');
  }

  return {
    ...evaluateChangedFileQuality({
      changedFiles: files,
      diagnostics: [...tsDiagnostics, ...lintDiagnostics],
    }),
    changedFiles: files,
  };
}

function printHits(hits) {
  for (const hit of hits) {
    console.error(
      `${hit.source} ${hit.file}:${hit.line}:${hit.column} ${hit.code} ${hit.message}`
    );
  }
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return path.normalize(self) === path.normalize(invoked);
}

if (isMain()) {
  const result = await runQualityCheck();
  if (result.skipped === 'no-changed-ts') {
    console.log('quality:changed — no changed TypeScript files');
    process.exit(0);
  }
  console.log(`quality:changed — checking ${result.changedFiles.length} file(s)`);
  if (!result.ok) {
    console.error(
      `quality:changed failed: ${result.hits.length} error(s) in changed files`
    );
    printHits(result.hits);
    process.exit(1);
  }
  console.log('quality:changed passed');
  process.exit(0);
}
