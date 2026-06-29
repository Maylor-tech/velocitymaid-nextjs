/**
 * Ensures Middlebury branch exists and Port Antonio is suppressed from booking.
 * Run: npx tsx scripts/ensure-booking-branches.ts
 */
import { prisma } from '../lib/prisma';

async function ensureMiddleburyBranch() {
  const vermont = await prisma.branch.findUnique({
    where: { slug: 'vermont' },
    include: { PricingModel: true },
  });

  const existing = await prisma.branch.findUnique({
    where: { slug: 'vermont-middlebury' },
  });

  if (existing) {
    await prisma.branch.update({
      where: { slug: 'vermont-middlebury' },
      data: {
        name: 'Vermont — Middlebury',
        city: 'Middlebury',
        state: 'Vermont',
        regionLabel: 'Addison County',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });
    console.log('Updated Vermont — Middlebury branch');
    return;
  }

  let pricingModelId = vermont?.pricingModelId ?? null;
  if (!pricingModelId) {
    const model = await prisma.pricingModel.create({
      data: {
        id: `pricing-vt-mb-${Date.now()}`,
        name: 'Vermont Middlebury Standard',
        billingType: 'FLAT',
        currency: 'USD',
        baseRate: 110,
        extraHourRate: 35,
        minHours: 2,
        internalNotes: 'Middlebury / Addison County pricing',
        updatedAt: new Date(),
      },
    });
    pricingModelId = model.id;
  }

  await prisma.branch.create({
    data: {
      id: `branch-vt-mb-${Date.now()}`,
      name: 'Vermont — Middlebury',
      slug: 'vermont-middlebury',
      country: 'United States',
      state: 'Vermont',
      city: 'Middlebury',
      regionLabel: 'Addison County',
      timezone: 'America/New_York',
      primaryPhone: '(802) 733-5348',
      whatsappNumber: '18027335348',
      pricingModelId,
      status: 'ACTIVE',
      currency: 'USD',
      updatedAt: new Date(),
    },
  });
  console.log('Created Vermont — Middlebury branch');
}

async function suppressPortAntonio() {
  const pa = await prisma.branch.findUnique({ where: { slug: 'port-antonio' } });
  if (!pa) {
    console.log('Port Antonio branch not found — skip');
    return;
  }
  if (pa.status === 'PAUSED') {
    console.log('Port Antonio already PAUSED');
    return;
  }
  await prisma.branch.update({
    where: { slug: 'port-antonio' },
    data: { status: 'PAUSED', updatedAt: new Date() },
  });
  console.log('Port Antonio set to PAUSED');
}

async function main() {
  await ensureMiddleburyBranch();
  await suppressPortAntonio();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
