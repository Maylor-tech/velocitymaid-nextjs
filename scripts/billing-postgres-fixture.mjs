/** Disposable CI database only. This script refuses existing/nonlocal targets. */
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FIXTURE_URL = 'postgresql://billing_test:billing_test_fixture@127.0.0.1:5432/velocitymaid_billing_test';
export function assertBillingFixture(env = process.env) {
  if (env.RUN_BILLING_POSTGRES_TESTS !== '1' || env.DATABASE_URL !== FIXTURE_URL || env.DIRECT_URL !== FIXTURE_URL) {
    throw new Error('Refusing database verification: explicit disposable localhost fixture required');
  }
  return FIXTURE_URL;
}

export async function prepareBillingFixture() {
  const url = assertBillingFixture();
  const db = new PrismaClient({ datasources: { db: { url } } });
  const folder = mkdtempSync(path.join(tmpdir(), 'vm-billing-pg-'));
  try {
    const tables = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    if (tables.length) throw new Error('Refusing to initialize a nonempty database');
    const schema = execFileSync('git', ['show', '28a10318aaa312a9a87ed2c51fb21257b85b7e02:prisma/schema.prisma'], { encoding: 'utf8' });
    const baselineSchema = path.join(folder, 'schema.prisma');
    const baselineSql = path.join(folder, 'baseline.sql');
    writeFileSync(baselineSchema, schema);
    const cli = path.resolve('node_modules/prisma/build/index.js');
    const generated = execFileSync(process.execPath, [cli, 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', baselineSchema, '--script'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    writeFileSync(baselineSql, generated);
    execFileSync(process.execPath, [cli, 'db', 'execute', '--file', baselineSql, '--schema', 'prisma/schema.prisma'], { stdio: 'inherit' });
    const migration = 'prisma/migrations/20261031230000_invoice_reminder_deliveries/migration.sql';
    if (!readFileSync(migration, 'utf8').includes('ENABLE ROW LEVEL SECURITY')) throw new Error('Expected reminder migration missing');
    execFileSync(process.execPath, [cli, 'db', 'execute', '--file', migration, '--schema', 'prisma/schema.prisma'], { stdio: 'inherit' });
    console.log('Disposable baseline + exact reminder migration applied. No production target used.');
  } finally {
    await db.$disconnect();
    rmSync(folder, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepareBillingFixture().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
