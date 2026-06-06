import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name === "route.ts") acc.push(p);
  }
  return acc;
}

const apiRoot = path.join(root, "app", "api");
const routes = walk(apiRoot);

const TODO_BLOCK = [
  /\s*\/\/ TODO: Add admin authentication check\n/g,
  /\s*\/\/ TODO: Protect this route with admin authentication\n/g,
  /\s*\* TODO: Protect this route with admin authentication\n/g,
  /\s*\/\/ if \(!isAdmin\(request\)\) \{\n\s*\/\/   return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 403 \}\);\n\s*\/\/ \}\n/g,
];

for (const file of routes) {
  let content = fs.readFileSync(file, "utf8");
  const hadTodo = TODO_BLOCK.some((p) => p.test(content));
  for (const p of TODO_BLOCK) content = content.replace(p, "");

  const usesAuth = content.includes('requireRole(request, "ADMIN")');
  if (usesAuth && !content.includes("requireRole")) {
    /* skip */
  }
  if (usesAuth && !content.includes('from "@/lib/auth/requireRole"') && !content.includes("from '@/lib/auth/requireRole'")) {
    content = content.replace(
      /(import \{ NextRequest, NextResponse \} from ['"]next\/server['"];?\n)/,
      `$1import { requireRole } from "@/lib/auth/requireRole";\n`
    );
  }

  if (usesAuth && content.includes("} catch (error") && !content.includes("instanceof NextResponse")) {
    content = content.replace(
      /(\} catch \(error(?:: any)?\) \{)\n(\s*)(console\.|return )/,
      `$1\n$2if (error instanceof NextResponse) return error;\n$2$3`
    );
  }

  if (hadTodo || usesAuth) {
    fs.writeFileSync(file, content);
  }
}

console.log("cleanup done", routes.length, "routes scanned");
