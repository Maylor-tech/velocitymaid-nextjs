import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "app", "api");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`);
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(p));
    } else if (entry.isFile() && entry.name === "route.ts") {
      out.push(p);
    }
  }
  return out;
}

function fileUsesPrisma(src) {
  // Covers common cases: import { prisma } from '@/lib/prisma'
  // Also catches "prisma." usage even if import is indirect
  return (
    src.includes("from '@/lib/prisma'") ||
    src.includes('from "@/lib/prisma"') ||
    src.includes("from '@/lib/prisma';") ||
    src.includes('from "@/lib/prisma";') ||
    src.includes("prisma.") ||
    src.includes("PrismaClient") ||
    src.includes("@prisma/client")
  );
}

function hasNodeRuntime(src) {
  return (
    src.includes("export const runtime = 'nodejs'") ||
    src.includes('export const runtime = "nodejs"')
  );
}

function insertRuntime(src) {
  // Put runtime at the very top, before other exports/imports
  // unless there's a "use server" (rare in route handlers)
  const lines = src.split(/\r?\n/);
  
  // Find the first non-comment, non-empty line
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith("//") && !line.startsWith("/*")) {
      insertAt = i;
      break;
    }
  }
  
  // Check if there's already a runtime or dynamic export
  const hasRuntimeOrDynamic = lines.some(
    (line) =>
      line.includes("export const runtime") ||
      line.includes("export const dynamic")
  );
  
  if (hasRuntimeOrDynamic) {
    // Insert right before the first export const
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("export const runtime") || lines[i].includes("export const dynamic")) {
        insertAt = i;
        break;
      }
    }
  }
  
  // Don't insert if it's already there
  if (lines[insertAt]?.includes("export const runtime = 'nodejs'") ||
      lines[insertAt]?.includes('export const runtime = "nodejs"')) {
    return src;
  }
  
  lines.splice(insertAt, 0, "export const runtime = 'nodejs';");
  return lines.join("\n");
}

const files = walk(API_DIR);
let changed = 0;
let skipped = 0;

console.log(`Scanning ${files.length} API route files...\n`);

for (const f of files) {
  try {
    const src = fs.readFileSync(f, "utf8");
    if (!fileUsesPrisma(src)) {
      skipped++;
      continue;
    }
    if (hasNodeRuntime(src)) {
      skipped++;
      continue;
    }

    const next = insertRuntime(src);
    fs.writeFileSync(f, next, "utf8");
    changed++;
    console.log("✅ added runtime:", path.relative(ROOT, f));
  } catch (error) {
    console.error(`❌ Error processing ${f}:`, error.message);
  }
}

console.log(`\n✅ Done. Updated ${changed} files, skipped ${skipped} files (already had runtime or don't use Prisma).`);

