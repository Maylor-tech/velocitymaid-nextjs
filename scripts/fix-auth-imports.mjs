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

const importLine = 'import { requireRole } from "@/lib/auth/requireRole";\n';
const todoLine = /^\s*\/\/ TODO: (Add admin authentication check|Protect this route with admin authentication)\s*$/gm;
const todoBlock = /^\s*\/\/ if \(!isAdmin\(request\)\)[\s\S]*?\/\/ \}\s*$/gm;

for (const file of walk(path.join(root, "app", "api"))) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  c = c.replace(todoLine, "");
  c = c.replace(todoBlock, "");
  c = c.replace(/\n\n\n+/g, "\n\n");

  if (c.includes('requireRole(request, "ADMIN")') && !c.includes("@/lib/auth/requireRole")) {
    if (c.includes('from "next/server"')) {
      c = c.replace(/import \{([^}]+)\} from "next\/server";\n/, `import {$1} from "next/server";\n${importLine}`);
    } else if (c.includes("from 'next/server'")) {
      c = c.replace(/import \{([^}]+)\} from 'next\/server';\n/, `import {$1} from 'next/server';\n${importLine}`);
    } else {
      c = importLine + c;
    }
  }

  if (c !== orig) fs.writeFileSync(file, c);
}

console.log("fixed imports and todos");
