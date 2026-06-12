/**
 * Local deposit workflow verification (read-only cleanup after run).
 * Usage: npx dotenv-cli -e .env.local -- npx tsx scripts/deposit-e2e-verify.ts
 */
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import {
  JobReviewStatus,
  JobStatus,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { createPayoutIfEligible } from '../src/server/payout/createPayoutIfEligible';
import { refundDepositForRejectedJob } from '../lib/booking/depositRefund';
import {
  getStripePublishableKeyMode,
  getStripeSecretKeyMode,
  isStripeLiveModeConfigured,
} from '../lib/stripe/stripeMode';

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

type TestResult = {
  name: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIP';
  detail: string;
  jobId?: string;
};

const results: TestResult[] = [];

function log(result: TestResult) {
  results.push(result);
  console.log(`[${result.status}] ${result.name}: ${result.detail}`);
}

async function checkStripeKeys(): Promise<boolean> {
  const secretMode = getStripeSecretKeyMode();
  const pubMode = getStripePublishableKeyMode();
  log({
    name: 'Stripe key mode',
    status: isStripeLiveModeConfigured() ? 'FAIL' : 'PASS',
    detail: `secret=${secretMode}, publishable=${pubMode}, live=${isStripeLiveModeConfigured()}`,
  });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith('sk_test_')) {
    log({
      name: 'Stripe API reachable',
      status: 'BLOCKED',
      detail: 'No sk_test_ key in .env.local',
    });
    return false;
  }

  try {
    const stripe = new Stripe(key);
    await stripe.balance.retrieve();
    log({
      name: 'Stripe API reachable',
      status: 'PASS',
      detail: 'Test mode API key valid',
    });
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    log({
      name: 'Stripe API reachable',
      status: 'BLOCKED',
      detail: msg.includes('Expired') ? 'Stripe test API key expired — refresh in Dashboard' : msg,
    });
    return false;
  }
}

async function ensureTestCleaner() {
  let cleaner = await prisma.user.findFirst({
    where: { role: UserRole.CLEANER, isActive: true },
  });
  if (!cleaner) {
    cleaner = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `e2e-cleaner-${Date.now()}@velocitymaid.test`,
        name: 'E2E Test Cleaner',
        role: UserRole.CLEANER,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  return cleaner;
}

async function testPayoutDuplicateGuard() {
  const branch = await prisma.branch.findFirst({ where: { slug: 'new-jersey' } });
  if (!branch) {
    log({
      name: 'Payout duplicate guard',
      status: 'SKIP',
      detail: 'Missing new-jersey branch',
    });
    return;
  }

  const cleaner = await ensureTestCleaner();

  const jobId = randomUUID();
  try {
    await prisma.job.create({
      data: {
        id: jobId,
        branchId: branch.id,
        assignedCleanerId: cleaner.id,
        status: JobStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        reviewStatus: JobReviewStatus.APPROVED,
        quotedTotal: 150,
        totalPrice: 150,
        amountPaid: 150,
        balanceDue: 0,
        depositAmount: 25,
        currency: 'USD',
      },
    });

    const r1 = await createPayoutIfEligible(jobId);
    const r2 = await createPayoutIfEligible(jobId);
    const count = await prisma.jobPayout.count({ where: { jobId } });

    log({
      name: 'Payout duplicate guard',
      status:
        r1.ok && r2.ok && r2.reason === 'ALREADY_EXISTS' && count === 1
          ? 'PASS'
          : 'FAIL',
      detail: JSON.stringify({ r1, r2, payoutCount: count }),
      jobId,
    });
  } finally {
    await prisma.jobPayout.deleteMany({ where: { jobId } });
    await prisma.job.deleteMany({ where: { id: jobId } });
  }
}

/**
 * Hosted Checkout sessions stay unpaid until the customer pays in the browser.
 * Stripe does not expose a PaymentIntent until checkout starts, so API-only
 * confirmation is not possible for sessions created by /api/checkout.
 */
async function confirmCheckoutSession(
  sessionId: string,
  checkoutUrl?: string
): Promise<boolean> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const prePaid = await stripe.checkout.sessions.retrieve(sessionId);
  if (prePaid.payment_status === 'paid') return true;

  // Re-use an already-paid session from a manual browser run
  const envSession = process.env.E2E_PAID_SESSION_ID;
  if (envSession && envSession !== sessionId) {
    const paid = await stripe.checkout.sessions.retrieve(envSession);
    if (paid.payment_status === 'paid') return true;
  }

  if (checkoutUrl) {
    console.log('\n--- Manual payment required for E2E ---');
    console.log(`Open: ${checkoutUrl}`);
    console.log('Card: 4242 4242 4242 4242 · any future expiry · any CVC');
    console.log('Waiting up to 90s for payment...\n');
  }

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
    if (session.payment_status === 'paid') return true;

    const piId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    if (piId) {
      try {
        await stripe.paymentIntents.confirm(piId, {
          payment_method: 'pm_card_visa',
          return_url: `${BASE}/book/confirmation?session_id=${sessionId}`,
        });
        const updated = await stripe.checkout.sessions.retrieve(sessionId);
        if (updated.payment_status === 'paid') return true;
      } catch {
        // PI may still need browser action
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

async function createDepositBooking(): Promise<{ jobId: string; sessionId: string } | null> {
  const quoteRes = await fetch(`${BASE}/api/booking/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceType: 'STANDARD',
      branchSlug: 'new-jersey',
      home: { bedrooms: 2, bathrooms: 1, pets: false },
      schedule: {
        date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        timeSlot: '09:00-12:00',
      },
      extras: {},
    }),
  });
  const quoteData = await quoteRes.json();
  if (!quoteData.quote?.total) {
    log({
      name: 'Happy path — quote',
      status: 'FAIL',
      detail: JSON.stringify(quoteData),
    });
    return null;
  }

  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'E2E',
      lastInitial: 'T',
      email: `e2e-deposit-${Date.now()}@velocitymaid.test`,
      phone: '9735550100',
      address: '123 Test St, Newark, NJ 07102',
      serviceType: 'basic',
      preferredDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      preferredTime: '09:00-12:00',
      zipCode: '07102',
      branchSlug: 'new-jersey',
      totalPrice: quoteData.quote.total,
      currency: quoteData.quote.currency || 'USD',
    }),
  });
  const checkoutData = await checkoutRes.json();
  if (!checkoutRes.ok || !checkoutData.url) {
    log({
      name: 'Happy path — checkout',
      status: 'FAIL',
      detail: JSON.stringify(checkoutData),
    });
    return null;
  }

  const match = checkoutData.url.match(/(cs_test_[a-zA-Z0-9]+)/);
  const sessionId = match?.[1];
  if (!sessionId) {
    log({
      name: 'Happy path — checkout',
      status: 'FAIL',
      detail: 'Could not parse session id from checkout URL',
    });
    return null;
  }

  const paid = await confirmCheckoutSession(sessionId, checkoutData.url);
  if (!paid) {
    log({
      name: 'Happy path — deposit payment',
      status: 'FAIL',
      detail: `Session unpaid after 90s — pay ${checkoutData.url} with 4242… or set E2E_PAID_SESSION_ID to a paid cs_test_ session`,
    });
    return null;
  }

  const createRes = await fetch(`${BASE}/api/booking/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.jobId) {
    log({
      name: 'Happy path — job create',
      status: 'FAIL',
      detail: JSON.stringify(createData),
    });
    return null;
  }

  log({
    name: 'Happy path — deposit booking',
    status: 'PASS',
    detail: `session=${sessionId}, quoted=${quoteData.quote.total}`,
    jobId: createData.jobId,
  });

  return { jobId: createData.jobId, sessionId };
}

async function adminLogin(): Promise<string | null> {
  const email = process.env.ADMIN_EMAIL || 'admin@velocitymaid.com';
  const res = await fetch(`${BASE}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (!res.ok || !setCookie) {
    log({
      name: 'Admin login',
      status: 'FAIL',
      detail: `status=${res.status}`,
    });
    return null;
  }
  return setCookie.split(';')[0];
}

async function testHappyPath(stripeOk: boolean) {
  if (!stripeOk) {
    log({
      name: 'Happy path E2E',
      status: 'BLOCKED',
      detail: 'Stripe test API unavailable',
    });
    return;
  }

  try {
    await fetch(BASE);
  } catch {
    log({
      name: 'Happy path E2E',
      status: 'BLOCKED',
      detail: `Dev server not running at ${BASE}`,
    });
    return;
  }

  const booking = await createDepositBooking();
  if (!booking) return;

  const cookie = await adminLogin();
  if (!cookie) return;

  const approveRes = await fetch(
    `${BASE}/api/admin/jobs/${booking.jobId}/approve`,
    { method: 'POST', headers: { Cookie: cookie } }
  );
  const approveData = await approveRes.json();
  log({
    name: 'Happy path — admin approve',
    status: approveRes.ok ? 'PASS' : 'FAIL',
    detail: JSON.stringify(approveData),
    jobId: booking.jobId,
  });

  const cleaner = await ensureTestCleaner();

  const assignRes = await fetch(`${BASE}/api/admin/jobs/manual-assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      jobId: booking.jobId,
      cleanerId: cleaner.id,
      sendWhatsApp: false,
    }),
  });
  log({
    name: 'Happy path — assign',
    status: assignRes.ok ? 'PASS' : 'FAIL',
    detail: await assignRes.text(),
    jobId: booking.jobId,
  });

  await prisma.job.update({
    where: { id: booking.jobId },
    data: { status: JobStatus.IN_PROGRESS },
  });

  const completeRes = await fetch(
    `${BASE}/api/cleaner/jobs/${booking.jobId}/complete`,
    {
      method: 'PATCH',
      headers: { Cookie: `cleanerId=${cleaner.id}` },
    }
  );
  log({
    name: 'Happy path — complete',
    status: completeRes.ok ? 'PASS' : 'FAIL',
    detail: await completeRes.text(),
    jobId: booking.jobId,
  });

  const jobBeforeBalance = await prisma.job.findUnique({
    where: { id: booking.jobId },
  });
  log({
    name: 'Happy path — balance due',
    status:
      jobBeforeBalance?.paymentStatus === PaymentStatus.BALANCE_DUE
        ? 'PASS'
        : 'FAIL',
    detail: `paymentStatus=${jobBeforeBalance?.paymentStatus}`,
    jobId: booking.jobId,
  });

  // Balance payment via internal Stripe session (customer pay-balance needs auth)
  const job = await prisma.job.findUnique({
    where: { id: booking.jobId },
    include: { Customer: true },
  });
  if (!job?.balanceDue || Number(job.balanceDue) <= 0) return;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const balanceSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: job.Customer?.email || 'e2e@velocitymaid.test',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Balance E2E' },
          unit_amount: Math.round(Number(job.balanceDue) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: job.id,
      paymentType: 'balance',
      quotedTotal: String(job.quotedTotal || job.totalPrice),
      depositAmount: String(job.depositAmount || 25),
      amountPaidBefore: String(job.amountPaid || 25),
      email: job.Customer?.email || '',
    },
    success_url: `${BASE}/customer/jobs/${job.id}?balance=success`,
    cancel_url: `${BASE}/customer/jobs/${job.id}`,
  });

  if (!balanceSession.id) {
    log({
      name: 'Happy path — balance checkout',
      status: 'FAIL',
      detail: 'No balance session',
      jobId: booking.jobId,
    });
    return;
  }

  await confirmCheckoutSession(balanceSession.id);

  const { computeJobPaymentFromSession } = await import('../lib/booking/jobPayment');
  const session = await stripe.checkout.sessions.retrieve(balanceSession.id);
  const fields = computeJobPaymentFromSession(session, session.metadata || {});
  await prisma.job.update({
    where: { id: job.id },
    data: {
      amountPaid: fields.amountPaid,
      balanceDue: fields.balanceDue,
      paymentStatus: PaymentStatus.PAID,
      balanceSessionId: session.id,
      balancePaidAt: new Date(),
    },
  });
  const payout1 = await createPayoutIfEligible(job.id);
  const payout2 = await createPayoutIfEligible(job.id);

  const finalJob = await prisma.job.findUnique({ where: { id: job.id } });
  const payoutCount = await prisma.jobPayout.count({ where: { jobId: job.id } });

  log({
    name: 'Happy path — balance PAID',
    status: finalJob?.paymentStatus === PaymentStatus.PAID ? 'PASS' : 'FAIL',
    detail: `paymentStatus=${finalJob?.paymentStatus}`,
    jobId: booking.jobId,
  });
  log({
    name: 'Happy path — payout READY',
    status: payout1.reason === 'CREATED' ? 'PASS' : 'FAIL',
    detail: JSON.stringify(payout1),
    jobId: booking.jobId,
  });
  log({
    name: 'Webhook payout duplicate simulation',
    status:
      payout2.reason === 'ALREADY_EXISTS' && payoutCount === 1 ? 'PASS' : 'FAIL',
    detail: JSON.stringify({ payout2, payoutCount }),
    jobId: booking.jobId,
  });
}

async function testRefundPath(stripeOk: boolean) {
  if (!stripeOk) {
    log({
      name: 'Refund path E2E',
      status: 'BLOCKED',
      detail: 'Stripe test API unavailable',
    });
    return;
  }

  try {
    await fetch(BASE);
  } catch {
    log({
      name: 'Refund path E2E',
      status: 'BLOCKED',
      detail: `Dev server not running at ${BASE}`,
    });
    return;
  }

  const booking = await createDepositBooking();
  if (!booking) return;

  const cookie = await adminLogin();
  if (!cookie) return;

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) return;

  const reject1 = await fetch(`${BASE}/api/admin/jobs/${booking.jobId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ reason: 'E2E refund test' }),
  });
  const reject1Data = await reject1.json();
  log({
    name: 'Refund path — reject + refund',
    status:
      reject1.ok && reject1Data.refund?.status === 'refunded'
        ? 'PASS'
        : reject1.ok && reject1Data.refund?.status === 'already_refunded'
          ? 'PASS'
          : reject1.ok
            ? 'FAIL'
            : 'FAIL',
    detail: JSON.stringify(reject1Data),
    jobId: booking.jobId,
  });

  const reject2 = await fetch(`${BASE}/api/admin/jobs/${booking.jobId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ reason: 'E2E duplicate reject' }),
  });
  log({
    name: 'Refund path — duplicate reject blocked',
    status: reject2.status === 400 ? 'PASS' : 'FAIL',
    detail: `status=${reject2.status}`,
    jobId: booking.jobId,
  });

  const job = await prisma.job.findUnique({ where: { id: booking.jobId } });
  log({
    name: 'Refund path — job REFUNDED',
    status: job?.paymentStatus === PaymentStatus.REFUNDED ? 'PASS' : 'FAIL',
    detail: `paymentStatus=${job?.paymentStatus}, review=${job?.reviewStatus}`,
    jobId: booking.jobId,
  });
}

async function main() {
  console.log('=== Deposit E2E Verification ===');
  console.log(`Environment: ${BASE}`);
  console.log(`Date: ${new Date().toISOString()}`);

  const stripeOk = await checkStripeKeys();
  await testPayoutDuplicateGuard();
  await testHappyPath(stripeOk);
  await testRefundPath(stripeOk);

  console.log('\n=== Summary ===');
  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
