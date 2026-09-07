/**
 * Prints host/project identity. Never prints secrets.
 *
 *   node scripts/inspect-preview-env-identity.mjs .env.staging
 *   npx vercel env run -e preview -- node scripts/inspect-preview-env-identity.mjs --from-env
 */
import fs from 'node:fs';

const PROD_REF = 'chsahtnpwssyfrqzcncz';
const fromEnv =
  process.argv.includes('--from-env') ||
  (typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.startsWith('postgres'));
const fileArg = process.argv.find(
  (a) => a.endsWith('.staging') || /(?:^|[\\/])\.env(?:$|\.)/.test(a)
);
const file = fileArg || '.env.staging';

function parseDotenv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, i)] = v;
  }
  return env;
}

function parsePg(url) {
  if (!url) return { missing: true };
  if (url.includes('[SENSITIVE]')) return { placeholder: true };
  try {
    const u = new URL(url.replace(/^postgresql:/, 'http:'));
    const user = decodeURIComponent(u.username || '');
    const refFromUser = user.startsWith('postgres.')
      ? user.slice('postgres.'.length)
      : null;
    return {
      host: u.hostname,
      port: u.port,
      projectRef: refFromUser,
      userPrefix: user.split('.')[0] || null,
    };
  } catch {
    return { parseError: true };
  }
}

function parseHttp(url) {
  if (!url) return { missing: true };
  if (url.includes('[SENSITIVE]')) return { placeholder: true };
  const raw = String(url).trim().replace(/^["']|["']$/g, '');
  const embedded = raw.match(/([a-z0-9]+)\.supabase\.co/i);
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const m = u.hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
    const projectRef = m ? m[1] : embedded ? embedded[1] : null;
    return {
      host: m ? u.hostname : embedded ? `${embedded[1]}.supabase.co` : u.hostname,
      projectRef,
      protocol: u.protocol.replace(':', ''),
      containsSupabaseCo: Boolean(embedded) || u.hostname.includes('supabase.co'),
      containsProdRef:
        (projectRef === PROD_REF) ||
        u.hostname.includes(PROD_REF) ||
        raw.includes(PROD_REF),
    };
  } catch {
    return {
      parseError: !embedded,
      host: embedded ? `${embedded[1]}.supabase.co` : undefined,
      projectRef: embedded ? embedded[1] : undefined,
      length: raw.length,
      startsWithHttp: raw.startsWith('http'),
      containsSupabaseCo: raw.includes('supabase.co'),
      containsProdRef: raw.includes(PROD_REF),
    };
  }
}

function keyMeta(v) {
  if (!v) return { present: false };
  if (v.includes('[SENSITIVE]')) return { present: false, placeholder: true };
  return { present: true, length: v.length, looksLikeJwt: v.startsWith('eyJ') };
}

const env = fromEnv
  ? process.env
  : parseDotenv(fs.readFileSync(file, 'utf8'));
const db = parsePg(env.DATABASE_URL);
const direct = parsePg(env.DIRECT_URL);
const supabase = parseHttp(env.NEXT_PUBLIC_SUPABASE_URL);
const refs = [db.projectRef, direct.projectRef, supabase.projectRef].filter(Boolean);
const uniqueRefs = [...new Set(refs)];
const hitsProd =
  uniqueRefs.includes(PROD_REF) ||
  [db.host, direct.host, supabase.host]
    .filter(Boolean)
    .some((h) => String(h).includes(PROD_REF)) ||
  Boolean(supabase.containsProdRef);

const report = {
  source: fromEnv ? 'process.env' : file,
  DATABASE_URL: db,
  DIRECT_URL: direct,
  NEXT_PUBLIC_SUPABASE_URL: supabase,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: keyMeta(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: keyMeta(env.SUPABASE_SERVICE_ROLE_KEY),
  DISPATCH_STAGING: env.DISPATCH_STAGING || '(unset)',
  DISPATCH_STAGING_DB_CONFIRMED: env.DISPATCH_STAGING_DB_CONFIRMED || '(unset)',
  DISPATCH_NOTIFICATIONS: env.DISPATCH_NOTIFICATIONS || '(unset)',
  DISPATCH_OFFERS_VERMONT: env.DISPATCH_OFFERS_VERMONT || '(unset)',
  VERCEL_ENV: env.VERCEL_ENV || '(unset)',
  uniqueProjectRefs: uniqueRefs,
  matchesKnownProductionRef: hitsProd,
  placeholderSecretCount: fromEnv
    ? 0
    : Object.values(env).filter((v) => String(v).includes('[SENSITIVE]')).length,
};

console.log(JSON.stringify(report, null, 2));
if (hitsProd) {
  console.error('STOP: env still resolves to production project ref');
  process.exit(2);
}
if (db.placeholder || db.missing || db.parseError) {
  console.error('STOP: DATABASE_URL missing, placeholder, or unparseable');
  process.exit(2);
}
if (direct.placeholder || direct.missing || direct.parseError) {
  console.error('STOP: DIRECT_URL missing, placeholder, or unparseable');
  process.exit(2);
}
if (supabase.placeholder || supabase.missing || supabase.parseError) {
  console.error('STOP: NEXT_PUBLIC_SUPABASE_URL missing, placeholder, or unparseable');
  process.exit(2);
}
if (uniqueRefs.length !== 1) {
  console.error('STOP: database/supabase project refs are missing or do not match');
  process.exit(2);
}
