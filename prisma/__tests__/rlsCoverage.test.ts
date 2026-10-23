import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = path.join(process.cwd(), "prisma", "migrations");

const CREATE_TABLE =
  /CREATE TABLE(?: IF NOT EXISTS)?\s+(?:ONLY\s+)?(?:public\.)?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/gi;
const DROP_TABLE =
  /DROP TABLE(?: IF EXISTS)?\s+(?:ONLY\s+)?(?:public\.)?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/gi;
const ENABLE_RLS =
  /ALTER TABLE(?: IF EXISTS)?\s+(?:ONLY\s+)?(?:public\.)?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s+ENABLE ROW LEVEL SECURITY/gi;

type Event =
  | { at: number; kind: "create"; name: string }
  | { at: number; kind: "drop"; name: string }
  | { at: number; kind: "enable"; name: string }
  | { at: number; kind: "enable-existing-except-prisma" }
  | { at: number; kind: "enable-listed-if-present"; names: string[] };

function tableName(quoted: string | undefined, bare: string | undefined): string {
  if (quoted) return quoted;
  return (bare ?? "").toLowerCase();
}

function eventsIn(sql: string): Event[] {
  const events: Event[] = [];
  for (const match of sql.matchAll(CREATE_TABLE)) {
    events.push({
      at: match.index ?? 0,
      kind: "create",
      name: tableName(match[1], match[2]),
    });
  }
  for (const match of sql.matchAll(DROP_TABLE)) {
    events.push({
      at: match.index ?? 0,
      kind: "drop",
      name: tableName(match[1], match[2]),
    });
  }
  for (const match of sql.matchAll(ENABLE_RLS)) {
    events.push({
      at: match.index ?? 0,
      kind: "enable",
      name: tableName(match[1], match[2]),
    });
  }
  const catchAll = sql.indexOf("NOT LIKE '_prisma_%'");
  if (catchAll >= 0 && sql.includes("ENABLE ROW LEVEL SECURITY")) {
    events.push({ at: catchAll, kind: "enable-existing-except-prisma" });
  }
  const arrayMatch = sql.match(/tables text\[\] := ARRAY\[([\s\S]*?)\]/);
  if (arrayMatch && sql.includes("to_regclass") && sql.includes("ENABLE ROW LEVEL SECURITY")) {
    const names = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
    events.push({
      at: arrayMatch.index ?? 0,
      kind: "enable-listed-if-present",
      names,
    });
  }
  return events.sort((a, b) => a.at - b.at);
}

/** Tables that still lack RLS after every migration, in filename order. */
export function tablesWithoutRls(migrationSql: { name: string; sql: string }[]): string[] {
  const rls = new Map<string, boolean>();
  rls.set("_prisma_migrations", false);

  for (const migration of migrationSql) {
    for (const event of eventsIn(migration.sql)) {
      if (event.kind === "create") rls.set(event.name, false);
      if (event.kind === "drop") rls.delete(event.name);
      if (event.kind === "enable" && rls.has(event.name)) rls.set(event.name, true);
      if (event.kind === "enable-existing-except-prisma") {
        for (const name of rls.keys()) {
          if (!name.startsWith("_prisma")) rls.set(name, true);
        }
      }
      if (event.kind === "enable-listed-if-present") {
        for (const name of event.names) {
          if (rls.has(name)) rls.set(name, true);
        }
      }
    }
  }

  return [...rls.entries()]
    .filter(([, enabled]) => !enabled)
    .map(([name]) => name)
    .sort();
}

function loadMigrations(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => entry !== "migration_lock.toml")
    .sort()
    .map((entry) => ({
      name: entry,
      sql: readFileSync(path.join(MIGRATIONS_DIR, entry, "migration.sql"), "utf8"),
    }));
}

describe("public table RLS coverage", () => {
  const migrations = loadMigrations();
  const latest = migrations[migrations.length - 1];

  it("leaves no public table without RLS after the migrations run", () => {
    expect(tablesWithoutRls(migrations)).toEqual([]);
  });

  it("locks the remaining tables without forcing RLS or opening a public policy", () => {
    expect(latest.name).toBe("20261022220000_enable_rls_remaining_tables");
    expect(latest.sql).not.toContain("FORCE ROW LEVEL SECURITY");
    expect(latest.sql).not.toMatch(/TO (anon|authenticated|public)\b/);
    expect(latest.sql).toContain('FOR ALL TO postgres');
    expect(latest.sql).toContain('FOR ALL TO service_role');
    for (const table of [
      "WorkerAgreement",
      "WorkerDocument",
      "_prisma_migrations",
      "api_rate_limit_buckets",
      "guest_tip_authorizations",
      "invoice_checkout_sessions",
      "property_photo_slots",
      "service_feedback",
      "tip_allocations",
      "tip_webhook_events",
    ]) {
      expect(latest.sql).toContain(`'${table}'`);
    }
  });
});
