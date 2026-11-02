import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { buildInvoiceViewUrl } from '@/lib/invoices/invoiceViewUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const branchOrigin = 'https://velocitymaid-nextjs-git-32a4bd-maylortech007-gmailcoms-projects.vercel.app';
const projectRef = 'wfudxrziqyfvrdgnocky';
function stagingConnection(value: string | undefined) {
  try {
    const u = new URL(value || '');
    return {
      matches: ['postgres:', 'postgresql:'].includes(u.protocol) &&
        u.hostname.endsWith('.pooler.supabase.com') &&
        decodeURIComponent(u.username).endsWith('.' + projectRef),
      role: decodeURIComponent(u.username).split('.')[0],
      database: decodeURIComponent(u.pathname.slice(1)),
    };
  } catch { return { matches: false, role: '', database: '' }; }
}
function correctOrigin(value: string | undefined): boolean {
  try { return new URL(value || '').origin === branchOrigin; } catch { return false; }
}

/** Temporary read-only diagnostic. No provider calls, business rows or secret/error serialization. */
export async function GET(request: NextRequest) {
  // This check must precede authentication, DB queries and environment reporting.
  if (process.env.VERCEL_ENV !== 'preview') return new NextResponse(null, { status: 404 });
  try {
    await requireRole(request, 'ADMIN');
  } catch {
    return NextResponse.json({ success: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  const connection = stagingConnection(process.env.DATABASE_URL);
  let database = {
    connectionOk: false, transactionReadOnly: false, roleMatchesConfigured: false,
    databaseMatchesConfigured: false, roleBypassesRls: false,
  };
  if (connection.matches) {
    try {
      database = await prisma.$transaction(async tx => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        const rows = await tx.$queryRawUnsafe<Array<{
          db: string; role: string; read_only: string; bypass: boolean;
        }>>(
          "SELECT current_database() AS db, current_user AS role, current_setting('transaction_read_only') AS read_only, (rolsuper OR rolbypassrls) AS bypass FROM pg_roles WHERE rolname = current_user",
        );
        const row = rows[0];
        return {
          connectionOk: !!row, transactionReadOnly: row?.read_only === 'on',
          roleMatchesConfigured: row?.role === connection.role,
          databaseMatchesConfigured: row?.db === connection.database,
          roleBypassesRls: row?.bypass === true,
        };
      }, { timeout: 10000, maxWait: 5000 });
    } catch { /* Keep boolean failure only; never return/log database errors. */ }
  }
  const credentials = Object.fromEntries([
    'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET', 'STRIPE_TIP_WEBHOOK_SECRET', 'WHATSAPP_TOKEN',
    'WHATSAPP_ACCESS_TOKEN', 'ADMIN_WEBHOOK_URL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  ].map(name => [name, !!process.env[name]?.trim()]));
  const configuredOrigins = Object.fromEntries([
    'BASE_URL', 'NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL',
    'STRIPE_BILLING_PORTAL_RETURN_URL',
  ].map(name => [name, correctOrigin(process.env[name])]));
  return NextResponse.json({
    safety: {
      previewRuntime: process.env.VERCEL_ENV === 'preview',
      stagingMode: process.env.DISPATCH_STAGING === 'true',
      notificationsOff: process.env.DISPATCH_NOTIFICATIONS === 'off',
      emailAllowlistEmpty: !process.env.DISPATCH_NOTIFICATION_ALLOWLIST?.trim(),
      phoneAllowlistEmpty: !process.env.DISPATCH_WHATSAPP_ALLOWLIST?.trim(),
      expandedRemindersOff: process.env.INVOICE_REMINDER_STAGES_ENABLED !== 'true',
      configuredDatabaseIsStaging: connection.matches,
      configuredDirectConnectionIsStaging: stagingConnection(process.env.DIRECT_URL).matches,
    },
    credentialsPresent: credentials,
    originsMatchBillingPreview: configuredOrigins,
    generatedInvoiceOriginMatchesBillingPreview: correctOrigin(buildInvoiceViewUrl('FICTIONAL-DIAGNOSTIC')),
    database,
    fictionalRecords: 'unverified',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
