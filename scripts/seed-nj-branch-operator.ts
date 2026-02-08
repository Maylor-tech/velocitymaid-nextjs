/**
 * Seed New Jersey Branch Operator onboarding
 *
 * - Ensures NJ branch exists (by slug new-jersey)
 * - Creates 3 realistic NJ sample jobs
 * - Creates 1 BRANCH_OPERATOR user for NJ (primaryBranchId + UserBranch)
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/seed-nj-branch-operator.ts
 *
 * Supabase "Tenant or user not found":
 *   Run the script with the DIRECT connection (port 5432), not the pooler.
 *   In .env.local set DATABASE_URL to the same value as DIRECT_URL, then run
 *   the seed; or run: set DATABASE_URL=%DIRECT_URL% && npx tsx scripts/seed-nj-branch-operator.ts
 */

import { prisma } from "../lib/prisma";
import { UserRole, BranchStatus } from "@prisma/client";

const NJ_BRANCH_SLUG = "new-jersey";
const BRANCH_OPERATOR_EMAIL = "nj-operator@velocitymaid.com";

const SAMPLE_JOBS = [
  {
    customerName: "Sarah Chen",
    address: "42 Washington St, Newark, NJ 07102",
    serviceType: "deep",
    preferredTime: "Morning",
    status: "RECEIVED" as const,
    totalPrice: 185,
  },
  {
    customerName: "Michael Torres",
    address: "88 Palisade Ave, Jersey City, NJ 07306",
    serviceType: "basic",
    preferredTime: "Afternoon",
    status: "ASSIGNED" as const,
    totalPrice: 120,
  },
  {
    customerName: "Emily Foster",
    address: "156 Main St, Hoboken, NJ 07030",
    serviceType: "deep",
    preferredTime: "Morning",
    status: "RECEIVED" as const,
    totalPrice: 220,
  },
];

async function main() {
  let branch = await prisma.branch.findUnique({
    where: { slug: NJ_BRANCH_SLUG },
  });

  if (!branch) {
    console.log("NJ branch not found; creating minimal New Jersey branch...");
  } else {
    console.log("NJ branch found:", branch.slug);
  }
  if (!branch) {
    const now = new Date();
    const pricingModel = await prisma.pricingModel.create({
      data: {
        id: `pricing-nj-${now.getTime()}`,
        name: "New Jersey Standard",
        billingType: "FLAT",
        currency: "USD",
        baseRate: 120,
        extraHourRate: 30,
        minHours: null,
        internalNotes: "Standard pricing for New Jersey",
        updatedAt: now,
      },
    });
    branch = await prisma.branch.create({
      data: {
        id: `branch-nj-${now.getTime()}`,
        name: "New Jersey",
        slug: NJ_BRANCH_SLUG,
        country: "United States",
        state: "New Jersey",
        city: "Newark",
        regionLabel: "New Jersey",
        timezone: "America/New_York",
        primaryPhone: "(973) 280-9190",
        whatsappNumber: "19732809190",
        managerId: null,
        pricingModelId: pricingModel.id,
        status: BranchStatus.ACTIVE,
        currency: "USD",
        updatedAt: now,
      },
    });
    console.log("✅ NJ branch created:", branch.slug);
  }

  const now = new Date();
  const baseId = `job-nj-seed-${now.getTime()}`;

  for (let i = 0; i < SAMPLE_JOBS.length; i++) {
    const j = SAMPLE_JOBS[i];
    const preferredDate = new Date(now);
    preferredDate.setDate(preferredDate.getDate() + (i + 1));

    await prisma.job.upsert({
      where: { id: `${baseId}-${i}` },
      update: {
        customerName: j.customerName,
        address: j.address,
        serviceType: j.serviceType,
        preferredTime: j.preferredTime,
        status: j.status,
        totalPrice: j.totalPrice,
        preferredDate,
        branchId: branch.id,
      },
      create: {
        id: `${baseId}-${i}`,
        branchId: branch.id,
        customerName: j.customerName,
        address: j.address,
        serviceType: j.serviceType,
        serviceLocation: "new_jersey",
        preferredTime: j.preferredTime,
        preferredDate,
        status: j.status,
        totalPrice: j.totalPrice,
        currency: "USD",
      },
    });
  }

  console.log("✅ Created 3 NJ sample jobs");

  const operatorId = `branch-operator-nj-${now.getTime()}`;
  const operator = await prisma.user.upsert({
    where: { email: BRANCH_OPERATOR_EMAIL },
    update: {
      role: UserRole.BRANCH_OPERATOR,
      primaryBranchId: branch.id,
      isActive: true,
      name: "NJ Branch Operator",
      updatedAt: now,
    },
    create: {
      id: operatorId,
      email: BRANCH_OPERATOR_EMAIL,
      name: "NJ Branch Operator",
      role: UserRole.BRANCH_OPERATOR,
      primaryBranchId: branch.id,
      isActive: true,
      updatedAt: now,
    },
  });

  await prisma.userBranch.upsert({
    where: {
      userId_branchId: { userId: operator.id, branchId: branch.id },
    },
    update: {},
    create: {
      id: `ub-nj-op-${now.getTime()}`,
      userId: operator.id,
      branchId: branch.id,
    },
  });

  console.log("✅ Branch operator user upserted");
  console.log("✅ BRANCH_OPERATOR user for NJ:");
  console.log(`   ID: ${operator.id}`);
  console.log(`   Email: ${operator.email}`);
  console.log(`   Branch: ${branch.name} (${branch.slug})`);
  console.log("✅ Seed completed");
}

main()
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Tenant or user not found") || msg.includes("FATAL")) {
      console.error(
        "\nSupabase connection failed. Try running the seed with the direct DB URL (port 5432).\n" +
          "In .env.local set DATABASE_URL to the same value as DIRECT_URL, then run:\n" +
          "  npx dotenv -e .env.local -- npx tsx scripts/seed-nj-branch-operator.ts\n"
      );
    }
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    console.log(">>> NJ SEED SCRIPT FINISHED");
    return prisma.$disconnect();
  });
