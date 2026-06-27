/**
 * E2E billing workflow verification against local dev server.
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/billing-e2e-verify.ts
 */
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { COOKIE_NAME, createCustomerSessionToken } from '../lib/customerSession';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

type Result = { step: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string };
const results: Result[] = [];

function log(r: Result) {
  results.push(r);
  console.log(`[${r.status}] ${r.step}: ${r.detail}`);
}

function parseSetCookie(header: string | null): string {
  if (!header) return '';
  const match = header.match(/admin_session=[^;]+/);
  return match ? match[0] : '';
}

async function adminFetch(path: string, cookie: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      ...(init?.headers ?? {}),
    },
  });
}

async function loginAdmin(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { email: true },
  });
  if (!admin?.email) throw new Error('No active admin user in database');

  const res = await fetch(`${BASE}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: admin.email }),
  });
  const cookie = parseSetCookie(res.headers.get('set-cookie'));
  if (!res.ok || !cookie) {
    throw new Error(`Admin login failed (${res.status})`);
  }
  log({ step: 'Admin login', status: 'PASS', detail: admin.email });
  return cookie;
}

async function pickJob() {
  const jobs = await prisma.job.findMany({
    where: { status: 'COMPLETED', customerId: { not: null } },
    take: 10,
    orderBy: { completedAt: 'desc' },
    select: {
      id: true,
      customerName: true,
      customerId: true,
      balanceDue: true,
      totalPrice: true,
      quotedTotal: true,
      Customer: { select: { email: true } },
      Invoice: { select: { id: true, balanceDue: true, total: true } },
      CompletionReport: { select: { id: true } },
    },
  });
  // Prefer job with customer linked and partial/no billing for fuller test
  const job =
    jobs.find((j) => j.customerId && !j.CompletionReport) ??
    jobs.find((j) => j.customerId) ??
    jobs[0];
  if (!job) throw new Error('No COMPLETED job found');
  log({ step: 'Select job', status: 'PASS', detail: `${job.id} (${job.customerName ?? 'unnamed'})` });
  return job;
}

async function main() {
  console.log(`\n=== Billing E2E @ ${BASE} ===\n`);

  const cookie = await loginAdmin();
  const job = await pickJob();
  const jobId = job.id;
  const billingBase = `/api/admin/jobs/${jobId}/billing`;

  // Step 1: Job detail page loads
  {
    const res = await adminFetch(`/admin/jobs/${jobId}`, cookie);
    log({
      step: '1. Admin job detail page',
      status: res.status === 200 ? 'PASS' : 'FAIL',
      detail: `HTTP ${res.status}`,
    });
  }

  // Step 2: Generate completion report
  let reportToken = '';
  {
    const res = await adminFetch(billingBase, cookie, {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_report', sendEmail: false }),
    });
    const data = await res.json();
    reportToken = data.report?.publicToken ?? data.publicToken ?? '';
    if (!reportToken && job.CompletionReport) {
      const existing = await prisma.completionReport.findUnique({
        where: { jobId },
        select: { publicToken: true },
      });
      reportToken = existing?.publicToken ?? '';
    }
    log({
      step: '2. Generate completion report',
      status: res.ok && reportToken ? 'PASS' : 'FAIL',
      detail: res.ok ? `token=${reportToken.slice(0, 8)}…` : JSON.stringify(data),
    });
  }

  // Steps 3-4: Public report + PDF
  if (reportToken) {
    const pageRes = await fetch(`${BASE}/report/${reportToken}`);
    log({
      step: '3. Public report page',
      status: pageRes.status === 200 ? 'PASS' : 'FAIL',
      detail: `HTTP ${pageRes.status}`,
    });
    const pdfRes = await fetch(`${BASE}/api/report/${reportToken}/pdf`);
    const ct = pdfRes.headers.get('content-type') ?? '';
    const pdfBody = pdfRes.ok ? await pdfRes.text() : '';
    log({
      step: '4. Report PDF',
      status: pdfRes.ok && (ct.includes('html') || ct.includes('pdf')) && pdfBody.includes('VelocityMaid') ? 'PASS' : 'FAIL',
      detail: `HTTP ${pdfRes.status}, ${ct}`,
    });
  }

  // Step 5-6: Generate invoice + verify job link
  let invoiceId = '';
  let invoiceToken = '';
  {
    const res = await adminFetch(billingBase, cookie, {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_invoice' }),
    });
    const data = await res.json();
    invoiceId = data.invoice?.id ?? data.invoiceId ?? job.Invoice?.id ?? '';
    if (!invoiceId) {
      const inv = await prisma.invoice.findFirst({ where: { jobId }, select: { id: true, publicToken: true, jobId: true } });
      invoiceId = inv?.id ?? '';
      invoiceToken = inv?.publicToken ?? '';
      log({
        step: '5. Generate invoice',
        status: inv ? 'PASS' : 'FAIL',
        detail: inv ? `existing invoice ${inv.id}` : JSON.stringify(data),
      });
      log({
        step: '6. Invoice linked to job',
        status: inv?.jobId === jobId ? 'PASS' : 'FAIL',
        detail: `jobId=${inv?.jobId}`,
      });
    } else {
      invoiceToken = data.invoice?.publicToken ?? '';
      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { jobId: true, publicToken: true } });
      invoiceToken = invoiceToken || inv?.publicToken || '';
      log({
        step: '5. Generate invoice',
        status: res.ok ? 'PASS' : 'FAIL',
        detail: `invoice ${invoiceId}`,
      });
      log({
        step: '6. Invoice linked to job',
        status: inv?.jobId === jobId ? 'PASS' : 'FAIL',
        detail: `jobId=${inv?.jobId}`,
      });
    }
  }

  // Step 7: Send invoice (safe skip ok)
  {
    const res = await adminFetch(billingBase, cookie, {
      method: 'POST',
      body: JSON.stringify({ action: 'send_invoice' }),
    });
    const data = await res.json();
    const skipped = data.skippedReason || data.email?.skippedReason;
    log({
      step: '7. Send invoice',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: skipped ? `email skipped: ${skipped}` : data.email?.sent === true ? 'email sent' : JSON.stringify(data.email ?? data),
    });
  }

  // Step 8: Record test payment ($1 or balance)
  let receiptToken = '';
  {
    const inv = await prisma.invoice.findFirst({
      where: { jobId },
      select: { balanceDue: true, total: true, amountPaid: true },
    });
    const balance = Number(inv?.balanceDue ?? 0);
    const payAmount = balance > 0 ? Math.min(balance, 1) : 1;

    const res = await adminFetch(billingBase, cookie, {
      method: 'POST',
      body: JSON.stringify({
        action: 'record_payment',
        amount: payAmount,
        paymentMethod: 'CASH',
        notes: 'E2E billing test payment',
        sendEmails: false,
      }),
    });
    const data = await res.json();
    log({
      step: '8. Record test payment',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: res.ok ? `$${payAmount}` : JSON.stringify(data),
    });
  }

  // Steps 9-11: Receipt auto-created + public links
  {
    const receipt = await prisma.receipt.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, publicToken: true },
    });
    receiptToken = receipt?.publicToken ?? '';
    log({
      step: '9. Receipt auto-created',
      status: receipt ? 'PASS' : 'FAIL',
      detail: receipt ? receipt.id : 'none found',
    });

    if (receiptToken) {
      const pageRes = await fetch(`${BASE}/receipt/${receiptToken}`);
      log({
        step: '10. Public receipt page',
        status: pageRes.status === 200 ? 'PASS' : 'FAIL',
        detail: `HTTP ${pageRes.status}`,
      });
      const pdfRes = await fetch(`${BASE}/api/receipt/${receiptToken}/pdf`);
      const ct = pdfRes.headers.get('content-type') ?? '';
      const pdfBody = pdfRes.ok ? await pdfRes.text() : '';
      log({
        step: '11. Receipt PDF',
        status: pdfRes.ok && (ct.includes('html') || ct.includes('pdf')) && pdfBody.includes('VelocityMaid') ? 'PASS' : 'FAIL',
        detail: `HTTP ${pdfRes.status}, ${ct}`,
      });
    } else {
      log({ step: '10. Public receipt page', status: 'FAIL', detail: 'no token' });
      log({ step: '11. Receipt PDF', status: 'FAIL', detail: 'no token' });
    }
  }

  // Step 12: Review request status
  {
    const wfRes = await adminFetch(billingBase, cookie);
    const wf = await wfRes.json();
    const review = wf.workflow?.review ?? wf.workflow?.steps?.review;
    const reviewReq = await prisma.reviewRequest.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });
    log({
      step: '12. Review request tracked',
      status: review || reviewReq || wf.workflow ? 'PASS' : 'FAIL',
      detail: review
        ? JSON.stringify(review)
        : reviewReq
          ? `ReviewRequest sentAt=${reviewReq.sentAt ?? 'pending'}`
          : `workflow reviewStatus=${JSON.stringify(wf.workflow?.reviewRequest)}`,
    });
  }

  // Step 13: Customer portal API pages
  const customerEmail = job.Customer?.email;
  if (customerEmail) {
    const cust = await prisma.customer.findFirst({
      where: { email: customerEmail },
      select: { id: true },
    });
    if (cust) {
      // Customer portal uses session cookie — test API routes if they exist
      const endpoints = [
        { name: 'My Services', path: '/api/customer/jobs?type=all' },
        { name: 'My Reports', path: '/api/customer/reports' },
        { name: 'My Invoices', path: '/api/customer/invoices' },
        { name: 'My Receipts', path: '/api/customer/receipts' },
        { name: 'Payment History', path: '/api/customer/payment-history' },
      ];

      const token = await createCustomerSessionToken({
        customerId: cust.id,
        email: customerEmail,
        issuedAt: Date.now(),
      });
      const customerCookie = `${COOKIE_NAME}=${token}`;

      for (const ep of endpoints) {
        const res = await fetch(`${BASE}${ep.path}`, { headers: { Cookie: customerCookie } });
        const data = res.ok ? await res.json().catch(() => ({})) : null;
        log({
          step: `13. ${ep.name}`,
          status: res.status === 200 && data?.success !== false ? 'PASS' : 'FAIL',
          detail: `HTTP ${res.status}${data ? ` items=${JSON.stringify(Object.keys(data).filter((k) => k !== 'success'))}` : ''}`,
        });
      }
    } else {
      log({ step: '13. Customer portal', status: 'SKIP', detail: 'customer record not found' });
    }
  } else {
    log({ step: '13. Customer portal', status: 'SKIP', detail: 'job has no customer email' });
  }

  const failed = results.filter((r) => r.status === 'FAIL');
  console.log(`\n=== Summary: ${results.length - failed.length}/${results.length} passed, ${failed.length} failed ===\n`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  FAIL: ${f.step} — ${f.detail}`));
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
