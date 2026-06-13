/**
 * Cleaner login + assigned job flow (Accept → Start → Complete)
 *
 * Usage:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/test-cleaner-job-flow.ts
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/test-cleaner-job-flow.ts --prepare
 *
 * Env:
 *   TEST_BASE_URL          (default: http://localhost:3000)
 *   TEST_CLEANER_EMAIL     (default: cleaner.nj@velocitymaid.com)
 */

import { JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const EMAIL = (
  process.env.TEST_CLEANER_EMAIL ||
  process.env.E2E_CLEANER_EMAIL ||
  'cleaner.nj@velocitymaid.com'
).toLowerCase();

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/cleaners/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: EMAIL }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}): ${JSON.stringify(body)}`);
  }
  const cookie = res.headers.get('set-cookie') ?? '';
  const match = cookie.match(/cleanerId=([^;]+)/);
  if (!match?.[1]) {
    throw new Error('Login succeeded but cleanerId cookie missing');
  }
  return match[1];
}

async function prepareAssignedJob(cleanerId: string): Promise<string> {
  let job = await prisma.job.findFirst({
    where: {
      assignedCleanerId: cleanerId,
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!job) {
    job = await prisma.job.findFirst({
      where: { assignedCleanerId: cleanerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (!job) {
    throw new Error(
      'No job assigned to test cleaner. Assign one in admin or run deposit booking first.'
    );
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: JobStatus.ASSIGNED,
      preferredDate: today,
      preferredTime: '09:00-12:00',
      onTheWayAt: null,
      completedAt: null,
      balanceDue: null,
      paymentStatus: PaymentStatus.DEPOSIT_PAID,
      assignedAt: new Date(),
    },
  });

  console.log(`Prepared job ${job.id} → ASSIGNED (deposit paid)`);
  return job.id;
}

async function patch(
  cookie: string,
  path: string,
  label: string
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { Cookie: `cleanerId=${cookie}` },
  });
  const body = await res.json();
  console.log(`${label}: ${res.status}`, body);
  if (!res.ok) {
    throw new Error(`${label} failed (${res.status})`);
  }
  return { status: res.status, body };
}

async function main() {
  const prepareOnly = process.argv.includes('--prepare');

  const cleaner = await prisma.user.findFirst({
    where: { email: EMAIL, role: 'CLEANER', isActive: true },
    select: { id: true, email: true, name: true },
  });

  if (!cleaner) {
    throw new Error(
      `No active cleaner for ${EMAIL}. Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-cleaner.ts`
    );
  }

  console.log(`Cleaner: ${cleaner.name} (${cleaner.email}) id=${cleaner.id}`);

  const jobId = await prepareAssignedJob(cleaner.id);
  if (prepareOnly) {
    console.log('Done (--prepare). Job ready for manual UI test.');
    return;
  }

  const cookie = await login();
  console.log('Login OK, cookie cleanerId:', cookie);

  if (cookie !== cleaner.id) {
    throw new Error(
      `Cookie id ${cookie} !== DB cleaner id ${cleaner.id}. Re-seed or clear cookies.`
    );
  }

  const listRes = await fetch(`${BASE}/api/cleaner/jobs?status=ASSIGNED`, {
    headers: { Cookie: `cleanerId=${cookie}` },
  });
  const listBody = await listRes.json();
  console.log('Jobs list (ASSIGNED):', listRes.status, listBody);

  const listed = (listBody as { jobs?: { id: string }[] }).jobs ?? [];
  if (!listed.some((j) => j.id === jobId)) {
    throw new Error(`Job ${jobId} not in ASSIGNED list`);
  }

  await patch(cookie, `/api/cleaner/jobs/${jobId}/accept`, 'Accept');
  await patch(cookie, `/api/cleaner/jobs/${jobId}/start`, 'Start');
  await patch(cookie, `/api/cleaner/jobs/${jobId}/complete`, 'Complete');

  const final = await prisma.job.findUnique({
    where: { id: jobId },
    select: { status: true, paymentStatus: true, balanceDue: true },
  });
  console.log('\nFinal job state:', final);
  console.log('\n✅ Cleaner job flow passed');
}

main()
  .catch((e) => {
    console.error('\n❌', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
