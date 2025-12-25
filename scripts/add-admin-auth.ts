import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { glob } from "glob";

const adminRoutes = [
  "app/api/admin/audit/logs/route.ts",
  "app/api/admin/branches/route.ts",
  "app/api/admin/branches/seed/route.ts",
  "app/api/admin/cleaners/route.ts",
  "app/api/admin/cleaners/applications/route.ts",
  "app/api/admin/cleaners/by-branch/route.ts",
  "app/api/admin/cleaners/training/route.ts",
  "app/api/admin/compliance/overview/route.ts",
  "app/api/admin/complaints/route.ts",
  "app/api/admin/contracts/route.ts",
  "app/api/admin/finance/overview/route.ts",
  "app/api/admin/finance/jamaica/route.ts",
  "app/api/admin/finance/jamaica/pnl/route.ts",
  "app/api/admin/finance/transactions/route.ts",
  "app/api/admin/franchise/applications/route.ts",
  "app/api/admin/jobs/auto-assign/route.ts",
  "app/api/admin/jobs/change-cleaner/route.ts",
  "app/api/admin/jobs/check-availability/route.ts",
  "app/api/admin/jobs/list/route.ts",
  "app/api/admin/jobs/manual-assign/route.ts",
  "app/api/admin/metrics/overview/route.ts",
  "app/api/admin/ops/run/route.ts",
  "app/api/admin/payout-shadow/run/route.ts",
  "app/api/admin/payouts/route.ts",
  "app/api/admin/payouts/jamaica/approve/route.ts",
  "app/api/admin/payouts/jamaica/create/route.ts",
  "app/api/admin/payouts/jamaica/forecast/route.ts",
  "app/api/admin/payouts/jamaica/list/route.ts",
  "app/api/admin/payouts/jamaica/paid/route.ts",
  "app/api/admin/payouts/preview/route.ts",
  "app/api/admin/payouts/shadow-backtest/route.ts",
  "app/api/admin/payouts/[payoutId]/route.ts",
  "app/api/admin/payouts/[payoutId]/mark-paid/route.ts",
  "app/api/admin/pricing-models/route.ts",
  "app/api/admin/recruitment/route.ts",
  "app/api/admin/schedule/assign/route.ts",
  "app/api/admin/schedule/jobs/route.ts",
  "app/api/admin/schedule/reassign/route.ts",
  "app/api/admin/scripts/check-jobs-status/route.ts",
  "app/api/admin/scripts/create-nj-payout-policy/route.ts",
  "app/api/admin/scripts/validate-payout-engine/route.ts",
  "app/api/admin/seed/cleaner/route.ts",
  "app/api/admin/users/route.ts",
  "app/api/admin/villas/route.ts",
  "app/api/admin/workers/run/route.ts",
];

function addAuthGuard(filePath: string): boolean {
  const fullPath = join(process.cwd(), filePath);
  let content = readFileSync(fullPath, "utf-8");

  if (content.includes("requireRole")) {
    return false;
  }

  const hasImport = content.includes('from "@/lib/auth/requireRole"') || content.includes("from '@/lib/auth/requireRole'");

  if (!hasImport) {
    const importMatch = content.match(/^import.*from.*["']next\/server["'];?/m);
    if (importMatch) {
      const importLine = importMatch[0];
      const newImport = importLine.replace(/;?\s*$/, "") + '\nimport { requireRole } from "@/lib/auth/requireRole";';
      content = content.replace(importLine, newImport);
    } else {
      content = 'import { requireRole } from "@/lib/auth/requireRole";\n' + content;
    }
  }

  const functionMatch = content.match(/export async function (GET|POST|PATCH|PUT|DELETE)\s*\([^)]*\)\s*\{/);
  if (functionMatch) {
    const funcStart = functionMatch[0];
    const tryMatch = content.match(new RegExp(funcStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n\\s*try\\s*\\{'));
    if (tryMatch) {
      const tryStart = tryMatch[0];
      const authLine = funcStart + '\n  try {\n    await requireRole(request, "ADMIN");';
      content = content.replace(tryStart, authLine);
    }
  }

  writeFileSync(fullPath, content, "utf-8");
  return true;
}

adminRoutes.forEach((file) => {
  try {
    if (addAuthGuard(file)) {
      console.log(`✅ Updated: ${file}`);
    } else {
      console.log(`✓ Already has auth: ${file}`);
    }
  } catch (error: any) {
    console.log(`❌ Error in ${file}: ${error.message}`);
  }
});














