/**
 * Reviewed backfill for Lou Lou's Landing (Tiffany Mayo) ONLY.
 *
 * Default: dry-run (prints planned writes, mutates nothing).
 * Apply:   npx tsx scripts/backfill-lou-lous-landing-property.ts --execute
 *
 * DO NOT run against production without explicit review.
 * Requires Property migration already applied.
 */
import { PrismaClient } from '@prisma/client';
import { addressesMatch } from '../lib/properties/normalizeAddress';

const EXECUTE = process.argv.includes('--execute');

const CUSTOMER_EMAIL = 'loulouslandingvt@gmail.com';
const PROPERTY_NAME = "Lou Lou's Landing";
const JOB_REFS = ['VM-2026-0014', 'VM-2026-0015'] as const;

async function main() {
  const prisma = new PrismaClient();
  try {
    const customer = await prisma.customer.findUnique({
      where: { email: CUSTOMER_EMAIL },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        addressLine1: true,
        city: true,
        state: true,
        defaultAddress: true,
        PipelineLead: {
          select: {
            bedrooms: true,
            bathrooms: true,
            propertyAddress: true,
            propertyType: true,
            notes: true,
          },
        },
      },
    });

    if (!customer) {
      console.error(`Customer not found for ${CUSTOMER_EMAIL}`);
      process.exit(1);
    }

    const address =
      customer.addressLine1?.trim() ||
      customer.PipelineLead?.propertyAddress?.trim() ||
      '';
    if (!address) {
      console.error('Customer has no address — aborting');
      process.exit(1);
    }

    const existing = await prisma.property.findMany({
      where: { customerId: customer.id },
    });
    const matched = existing.find((p) => addressesMatch(p.address, address));

    const propertyData = {
      customerId: customer.id,
      name: PROPERTY_NAME,
      address,
      city: customer.city,
      state: customer.state || 'VT',
      postalCode: null as string | null,
      bedrooms: customer.PipelineLead?.bedrooms ?? null,
      bathrooms:
        customer.PipelineLead?.bathrooms != null
          ? Number(customer.PipelineLead.bathrooms)
          : null,
      standingInstructions: customer.PipelineLead?.notes ?? null,
    };

    console.log(EXECUTE ? 'EXECUTE MODE' : 'DRY-RUN (pass --execute to apply)');
    console.log('Customer:', customer.id, customer.email);
    console.log('Property plan:', propertyData);
    console.log(
      matched
        ? `Would UPDATE existing Property ${matched.id}`
        : 'Would CREATE new Property'
    );

    const jobs = await prisma.job.findMany({
      where: {
        OR: [
          { jobReference: { in: [...JOB_REFS] } },
          { customerId: customer.id },
        ],
      },
      select: {
        id: true,
        jobReference: true,
        address: true,
        propertyId: true,
        serviceType: true,
        preferredDate: true,
      },
    });

    const linkable = jobs.filter(
      (j) =>
        (j.jobReference && JOB_REFS.includes(j.jobReference as (typeof JOB_REFS)[number])) ||
        addressesMatch(j.address, address)
    );

    console.log(
      'Jobs to link:',
      linkable.map((j) => ({
        id: j.id,
        ref: j.jobReference,
        address: j.address,
        currentPropertyId: j.propertyId,
      }))
    );

    if (!EXECUTE) {
      console.log('Dry-run complete — no writes.');
      return;
    }

    const property = matched
      ? await prisma.property.update({
          where: { id: matched.id },
          data: propertyData,
        })
      : await prisma.property.create({ data: propertyData });

    const updated = await prisma.job.updateMany({
      where: {
        id: { in: linkable.map((j) => j.id) },
        OR: [{ propertyId: null }, { propertyId: { not: property.id } }],
      },
      data: { propertyId: property.id },
    });

    console.log('Property id:', property.id);
    console.log('Jobs linked:', updated.count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
