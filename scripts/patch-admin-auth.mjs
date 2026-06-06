/**
 * One-off: add requireRole(request, "ADMIN") to routes with auth TODOs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "app/api/admin/jobs/change-cleaner/route.ts",
  "app/api/admin/recruitment/[id]/route.ts",
  "app/api/admin/recruitment/[id]/reject/route.ts",
  "app/api/admin/branches/[branchId]/set-pricing/route.ts",
  "app/api/payouts/export/route.ts",
  "app/api/admin/villas/[id]/status/route.ts",
  "app/api/admin/contracts/route.ts",
  "app/api/admin/branches/[branchId]/status/route.ts",
  "app/api/dashboard/profit/route.ts",
  "app/api/admin/franchise/applications/route.ts",
  "app/api/admin/pricing-models/route.ts",
  "app/api/admin/recruitment/route.ts",
  "app/api/admin/schedule/reassign/route.ts",
  "app/api/admin/payouts/jamaica/approve/route.ts",
  "app/api/admin/villas/route.ts",
  "app/api/payouts/update/route.ts",
  "app/api/admin/schedule/jobs/route.ts",
  "app/api/admin/branches/[branchId]/update-content/route.ts",
  "app/api/admin/payouts/jamaica/create/route.ts",
  "app/api/payouts/list/route.ts",
  "app/api/admin/cleaners/training/route.ts",
  "app/api/admin/scripts/validate-payout-engine/route.ts",
  "app/api/admin/cleaners/[cleanerId]/recalculate-score/route.ts",
  "app/api/admin/payouts/jamaica/forecast/route.ts",
  "app/api/admin/branches/[branchId]/add-service-areas/route.ts",
  "app/api/admin/cleaners/[cleanerId]/availability/route.ts",
  "app/api/admin/payouts/jamaica/list/route.ts",
  "app/api/admin/finance/jamaica/pnl/route.ts",
  "app/api/incentives/run-report/route.ts",
  "app/api/admin/finance/transactions/route.ts",
  "app/api/complaints/resolveViaReclean/route.ts",
  "app/api/admin/finance/jamaica/route.ts",
  "app/api/admin/training/[cleanerId]/reset/route.ts",
  "app/api/admin/schedule/assign/route.ts",
  "app/api/admin/branches/[branchId]/route.ts",
  "app/api/admin/payouts/jamaica/paid/route.ts",
  "app/api/admin/training/[cleanerId]/route.ts",
  "app/api/admin/cleaners/[cleanerId]/training/route.ts",
  "app/api/payouts/generate/route.ts",
  "app/api/admin/users/route.ts",
  "app/api/admin/scripts/create-nj-payout-policy/route.ts",
  "app/api/admin/training/[cleanerId]/override/route.ts",
  "app/api/complaints/list/route.ts",
  "app/api/complaints/update/route.ts",
  "app/api/admin/villas/[id]/route.ts",
  "app/api/admin/franchise/applications/[id]/route.ts",
  "app/api/dashboard/data/route.ts",
];

const TODO_PATTERNS = [
  /\s*\/\/ TODO: Add admin authentication check\n/g,
  /\s*\/\/ TODO: Protect this route with admin authentication\n/g,
  /\s*\* TODO: Protect this route with admin authentication\n/g,
];

const AUTH_LINE = '    await requireRole(request, "ADMIN");\n';
const AUTH_LINE_NO_INDENT = '  await requireRole(request, "ADMIN");\n';

function ensureImport(content) {
  if (content.includes('requireRole')) return content;
  const importLine = 'import { requireRole } from "@/lib/auth/requireRole";\n';
  if (content.includes('from "next/server"')) {
    return content.replace(
      /import \{([^}]+)\} from "next\/server";\n/,
      `import {$1} from "next/server";\n${importLine}`
    );
  }
  if (content.includes("from 'next/server'")) {
    return content.replace(
      /import \{([^}]+)\} from 'next\/server';\n/,
      `import {$1} from 'next/server';\n${importLine}`
    );
  }
  return importLine + content;
}

function patchCatch(content) {
  if (content.includes("instanceof NextResponse")) return content;
  return content.replace(
    /(\} catch \(error(?:: any)?\) \{)\n(\s*)console\./g,
    `$1\n$2if (error instanceof NextResponse) return error;\n$2console.`
  );
}

function injectAuthInHandlers(content) {
  if (content.includes('requireRole(request, "ADMIN")')) {
    return content;
  }

  return content.replace(
    /export async function (GET|POST|PUT|PATCH|DELETE)\([^)]*\) \{(\n\s*)(\/\/ TODO:[^\n]*\n)?(\s*try \{)?/g,
    (match, method, ws1, todo, tryBlock) => {
      if (tryBlock) {
        return `export async function ${method}(request: NextRequest) {${ws1}try {${ws1}  await requireRole(request, "ADMIN");`;
      }
      return `export async function ${method}(request: NextRequest) {${ws1}try {${ws1}  await requireRole(request, "ADMIN");`;
    }
  );
}

// Simpler: for each export async function, after "try {" add auth if not present
function patchFile(filePath) {
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) {
    console.warn("skip missing", filePath);
    return;
  }
  let content = fs.readFileSync(full, "utf8");
  if (content.includes('requireRole(request, "ADMIN")')) {
    for (const p of TODO_PATTERNS) content = content.replace(p, "");
    fs.writeFileSync(full, content);
    console.log("cleaned TODO only:", filePath);
    return;
  }

  for (const p of TODO_PATTERNS) content = content.replace(p, "");
  content = ensureImport(content);

  // Insert after each "try {" that follows export async function
  const lines = content.split("\n");
  const out = [];
  let inHandler = false;
  let addedInHandler = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    out.push(line);

    if (/export async function (GET|POST|PUT|PATCH|DELETE)/.test(line)) {
      inHandler = true;
      addedInHandler = false;
    }
    if (inHandler && /^\s*try \{/.test(line) && !addedInHandler) {
      const indent = line.match(/^(\s*)/)[1] + "  ";
      out.push(`${indent}await requireRole(request, "ADMIN");`);
      addedInHandler = true;
    }
    if (inHandler && /^\}\s*$/.test(line) && !line.includes("{")) {
      // weak end detection - skip
    }
  }

  content = out.join("\n");
  content = patchCatch(content);

  // handlers without try - add try wrapper is too invasive; handle dashboard/profit specially
  if (!content.includes('requireRole(request, "ADMIN")')) {
    content = content.replace(
      /export async function GET\(request: NextRequest\) \{\n/,
      'export async function GET(request: NextRequest) {\n  try {\n    await requireRole(request, "ADMIN");\n'
    );
    if (!content.includes("instanceof NextResponse")) {
      content = content.replace(
        /(\} catch \(error[^)]*\) \{)/,
        "$1\n    if (error instanceof NextResponse) return error;"
      );
    }
  }

  fs.writeFileSync(full, content);
  console.log("patched:", filePath);
}

for (const f of files) patchFile(f);
