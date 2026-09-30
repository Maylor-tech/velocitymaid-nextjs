/**
 * Gate 3 — production migrate status (read-only). Refuses staging. No deploy.
 *   npx dotenv-cli -e .env.local -- node scripts/gate3-prod-migrate-status-readonly.cjs
 */
const { spawnSync } = require('node:child_process');

const PROD = 'chsahtnpwssyfrqzcncz';
const STG = 'wfudxrziqyfvrdgnocky';
const TARGET = '20260929120000_job_guest_stay_dates';

const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
if (urls.length < 2) {
  console.error('STOP: DATABASE_URL and DIRECT_URL required');
  process.exit(2);
}
for (const u of urls) {
  if (u.includes(STG)) {
    console.error('STOP: staging ref');
    process.exit(2);
  }
  if (!u.includes(PROD)) {
    console.error('STOP: production ref missing');
    process.exit(2);
  }
}

const r = spawnSync('npx', ['prisma', 'migrate', 'status'], {
  encoding: 'utf8',
  shell: true,
  env: process.env,
});
const out = `${r.stdout || ''}${r.stderr || ''}`;
process.stdout.write(out);

const pendingBlock = out.match(
  /Following migrations? have not yet been applied:([\s\S]*?)(?:\n\n|\nTo apply|$)/i
);
const pending = pendingBlock
  ? pendingBlock[1]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
  : [];

const report = {
  gate: 'GATE3_PROD_MIGRATE_STATUS',
  pendingCount: pending.length,
  pending,
  targetPending: pending.includes(TARGET),
  onlyTargetPending: pending.length === 1 && pending[0] === TARGET,
  okToControlledMigrate:
    pending.includes(TARGET) &&
    pending.every((p) => p === TARGET || p.startsWith('20260929120000')),
};

console.log(JSON.stringify(report, null, 2));

if (!report.targetPending) {
  console.error('STOP: target migration not pending (already applied or missing)');
  process.exit(1);
}
if (!report.onlyTargetPending) {
  console.error(
    'WARN: additional pending migrations on production — review before deploy'
  );
  process.exit(4);
}
console.log('GATE3_PROD_MIGRATE_STATUS: PASS (only guest-stay-dates pending)');
