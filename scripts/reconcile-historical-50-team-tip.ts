/**
 * P0-D0 historical $50 reconcile runner.
 * DO NOT run against production until TipAllocation migration is applied
 * and this script is explicitly approved.
 *
 * Usage (after migrate):
 *   npx dotenv-cli -e .env -- npx tsx scripts/reconcile-historical-50-team-tip.ts --confirm
 */
import { prisma } from '@/lib/prisma';
import { reconcileHistorical50TeamTip } from '@/lib/tips/reconcileHistorical50TeamTip';

async function main() {
  const confirmed = process.argv.includes('--confirm');
  if (!confirmed) {
    console.log(
      JSON.stringify({
        ok: false,
        dryRun: true,
        message:
          'Refusing to mutate. Re-run with --confirm after TipAllocation migration is applied.',
      })
    );
    process.exit(2);
  }

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });
  if (!admin) {
    console.log(JSON.stringify({ ok: false, error: 'No ADMIN user' }));
    process.exit(1);
  }

  const result = await reconcileHistorical50TeamTip({ adminId: admin.id });
  console.log(JSON.stringify({ adminId: admin.id, result }, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
