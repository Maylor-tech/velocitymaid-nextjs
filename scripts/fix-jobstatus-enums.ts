/**
 * Fix JobStatus Enum Mismatches
 * 
 * This script helps identify and fix all JobStatus enum mismatches.
 * Run this to see what needs to be fixed.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filesToFix = [
  "app/api/customer/jobs/route.ts",
  "app/api/customer/jobs/[jobId]/cancel/route.ts",
  "app/api/customer/jobs/[jobId]/pay/route.ts",
  "app/api/customer/jobs/[jobId]/rate/route.ts",
  "app/api/customer/jobs/[jobId]/reschedule/route.ts",
  "lib/financial/helpers.ts",
  "app/api/admin/payouts/run/route.ts",
];

const replacements = [
  // String comparisons
  { from: /status\s*===\s*["']completed["']/g, to: 'status === JobStatus.COMPLETED' },
  { from: /status\s*===\s*["']cancelled["']/g, to: 'status === JobStatus.CANCELLED' },
  { from: /status\s*!==\s*["']completed["']/g, to: 'status !== JobStatus.COMPLETED' },
  { from: /status\s*!==\s*["']cancelled["']/g, to: 'status !== JobStatus.CANCELLED' },
  
  // Status assignments
  { from: /status:\s*["']completed["']/g, to: 'status: JobStatus.COMPLETED' },
  { from: /status:\s*["']cancelled["']/g, to: 'status: JobStatus.CANCELLED' },
  { from: /status:\s*["']CANCELLED_BY_CUSTOMER["']/g, to: 'status: JobStatus.CANCELLED' },
  { from: /status:\s*["']reschedule_requested["']/g, to: 'status: JobStatus.CONFIRMED' },
  
  // Array filters
  { from: /in:\s*\[["']completed["'],\s*["']cancelled["']\]/g, to: 'in: [JobStatus.COMPLETED, JobStatus.CANCELLED]' },
  { from: /in:\s*\["completed",\s*"cancelled"\]/g, to: 'in: [JobStatus.COMPLETED, JobStatus.CANCELLED]' },
];

function fixFile(filePath: string): { fixed: boolean; changes: string[] } {
  const fullPath = join(process.cwd(), filePath);
  let content = readFileSync(fullPath, "utf-8");
  const changes: string[] = [];
  let fixed = false;

  // Check if JobStatus is imported
  if (!content.includes("import") || !content.includes("JobStatus")) {
    // Add import if not present
    const importLine = `import { JobStatus } from "@prisma/client";`;
    if (content.includes("from '@prisma/client'") || content.includes('from "@prisma/client"')) {
      // Update existing import
      content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']@prisma\/client["']/,
        (match, imports) => {
          if (!imports.includes("JobStatus")) {
            return `import { ${imports.trim()}, JobStatus } from "@prisma/client"`;
          }
          return match;
        }
      );
    } else {
      // Add new import at top
      const lines = content.split("\n");
      let lastImportIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("import")) {
          lastImportIndex = i;
        }
      }
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join("\n");
      changes.push("Added JobStatus import");
    }
  }

  // Apply replacements
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      fixed = true;
      changes.push(`Replaced: ${from.toString()} → ${to}`);
    }
  });

  if (fixed) {
    writeFileSync(fullPath, content, "utf-8");
  }

  return { fixed, changes };
}

console.log("🔍 Scanning for JobStatus enum mismatches...\n");

let totalFixed = 0;
filesToFix.forEach((file) => {
  try {
    const result = fixFile(file);
    if (result.fixed) {
      console.log(`✅ Fixed: ${file}`);
      result.changes.forEach((change) => console.log(`   ${change}`));
      totalFixed++;
    } else {
      console.log(`✓ No issues: ${file}`);
    }
  } catch (error: any) {
    console.log(`❌ Error in ${file}: ${error.message}`);
  }
});

console.log(`\n📊 Summary: ${totalFixed} file(s) fixed`);















