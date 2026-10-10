/**
 * Elizabeth K Phase 2A apply — existing DRAFT VM-2026-0053 only.
 *
 *   ALLOW_PROD_MUTATION=ELIZABETH_K_PHASE2A \
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/elizabeth-k-phase2a-apply.ts --confirm APPLY_ELIZABETH_K_PHASE2A
 *
 * Does not run Phase 2B. Does not send, charge, refund, or execute payouts.
 */
import { applyElizabethKPhase2a } from '../lib/invoices/applyElizabethKPhase2a';

const confirm = process.argv.includes('--confirm')
  ? process.argv[process.argv.indexOf('--confirm') + 1]
  : undefined;

async function main() {
  const result = await applyElizabethKPhase2a({
    dryRun: false,
    confirmToken: confirm ?? '',
  });
  console.log(JSON.stringify({ phase: '2A', productionWrites: true, phase2b: false, result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
