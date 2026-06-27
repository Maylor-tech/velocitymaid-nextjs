/**
 * One-time seed: scheduled vacation-rental turnover jobs for the Chipman Park
 * client (Chris Ray Hautchamp), 198 Chipman Park, Middlebury, VT.
 *
 * Idempotent: re-running skips any job that already exists for this client on
 * the same scheduled date.
 *
 * Run:
 *   npm run seed:chipman
 *   (equivalently: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-chipman-jobs.ts)
 *
 * Column mapping (from prisma/schema.prisma — Job model):
 *   client name     -> customerName
 *   property address-> address
 *   service type    -> serviceType
 *   scheduled date  -> preferredDate
 *   market / branch -> branchId (Branch.slug = 'vermont')
 *   status          -> status (JobStatus enum; "scheduled" => CONFIRMED)
 *   amount / price  -> totalPrice
 *   notes           -> internalNotes
 *   created_at      -> createdAt (DB default now())
 */
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { JobStatus } from "@prisma/client";

const CLIENT_NAME = "Chris Ray Hautchamp";
const ADDRESS = "198 Chipman Park, Middlebury, VT 05753";
const SERVICE_TYPE = "Vacation Rental Turnover";
const AMOUNT = 300;
// The JobStatus enum has no SCHEDULED value; CONFIRMED represents a confirmed,
// upcoming booking and renders under "Scheduled" on the admin dashboard.
const SCHEDULED_STATUS: JobStatus = JobStatus.CONFIRMED;

interface SeedJob {
  scheduledDate: string; // YYYY-MM-DD (checkout date, clean due by 8pm)
  notes: string;
}

const JOBS: SeedJob[] = [
  {
    scheduledDate: "2026-07-04",
    notes:
      "Booking #2 — Check-in 07/01, Check-out 07/04. Agency: Airbnb. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-07-13",
    notes:
      "Booking #3 — Check-in 07/08, Check-out 07/13. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-07-19",
    notes:
      "Booking #4 — Check-in 07/17, Check-out 07/19. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-08-08",
    notes:
      "Booking #5 — Check-in 08/02, Check-out 08/08. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-08-16",
    notes:
      "Booking #6 — Check-in 08/14, Check-out 08/16. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-09-12",
    notes:
      "Booking #7 — Check-in 09/06, Check-out 09/12. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-09-20",
    notes:
      "Booking #8 — Check-in 09/18, Check-out 09/20. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-10-04",
    notes:
      "Booking #9 — Check-in 10/02, Check-out 10/04. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-10-19",
    notes:
      "Booking #10 — Check-in 10/16, Check-out 10/19. Agency: VRBO. Clean by 8pm.",
  },
  {
    scheduledDate: "2026-11-01",
    notes:
      "Booking #11 — Check-in 10/29, Check-out 11/01. Agency: Airbnb. Clean by 8pm.",
  },
];

/** Noon UTC keeps the calendar date stable across US timezones. */
function dateAtNoonUtc(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

function dayRange(dateStr: string): { start: Date; end: Date } {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

async function resolveBranchAndCustomer(): Promise<{
  branchId: string;
  customerId: string | null;
}> {
  // Prefer linking to the same branch/customer as the client's existing jobs.
  const reference = await prisma.job.findFirst({
    where: { customerName: CLIENT_NAME },
    select: { branchId: true, customerId: true },
  });

  if (reference?.branchId) {
    return { branchId: reference.branchId, customerId: reference.customerId };
  }

  const branch = await prisma.branch.findUnique({
    where: { slug: "vermont" },
    select: { id: true },
  });

  if (!branch) {
    throw new Error(
      'Vermont branch (slug "vermont") not found and no existing client jobs to reference.'
    );
  }

  return { branchId: branch.id, customerId: reference?.customerId ?? null };
}

async function main() {
  const { branchId, customerId } = await resolveBranchAndCustomer();
  console.log(
    `Target branchId=${branchId} customerId=${customerId ?? "(none)"}`
  );

  let inserted = 0;
  let skipped = 0;

  for (const job of JOBS) {
    const { start, end } = dayRange(job.scheduledDate);

    const existing = await prisma.job.findFirst({
      where: {
        customerName: CLIENT_NAME,
        preferredDate: { gte: start, lt: end },
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      console.log(`Skipping duplicate: ${job.scheduledDate}`);
      continue;
    }

    await prisma.job.create({
      data: {
        id: randomUUID(),
        branchId,
        customerId,
        customerName: CLIENT_NAME,
        address: ADDRESS,
        serviceType: SERVICE_TYPE,
        serviceLocation: ADDRESS,
        preferredDate: dateAtNoonUtc(job.scheduledDate),
        preferredTime: "8:00 PM",
        status: SCHEDULED_STATUS,
        totalPrice: AMOUNT,
        quotedTotal: AMOUNT,
        balanceDue: AMOUNT,
        currency: "USD",
        internalNotes: job.notes,
        marketLabel: "Vermont — Okemo Valley",
      },
    });

    inserted += 1;
    console.log(`Inserted job: ${job.scheduledDate}`);
  }

  const total = await prisma.job.count({
    where: { customerName: CLIENT_NAME, status: SCHEDULED_STATUS },
  });

  console.log("");
  console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`);
  console.log(
    `Verification: ${total} ${SCHEDULED_STATUS} jobs now exist for ${CLIENT_NAME}.`
  );
}

main()
  .catch((err) => {
    console.error("FAIL:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
