/**
 * One-time geocode pass for customers with addresses but no coordinates.
 *
 * Run:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/geocode-customers.ts
 *
 * Requires GOOGLE_MAPS_API_KEY in environment (Geocoding API enabled).
 */
import { prisma } from '../lib/prisma';
import { formatCustomerAddress } from '../lib/geocoding/customerAddress';
import { geocodeAddress, getGoogleMapsApiKey } from '../lib/geocoding/googleGeocode';

interface KnownProperty {
  label: string;
  latitude: number;
  longitude: number;
  match: (c: {
    firstName: string;
    lastName: string;
    defaultAddress: string | null;
    addressLine1: string | null;
  }) => boolean;
}

const KNOWN_PROPERTIES: KnownProperty[] = [
  {
    label: 'Chris Hautchamp — 198 Chipman Park, Middlebury, VT',
    latitude: 44.0063252,
    longitude: -73.1730138,
    match: (c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes('hautchamp') ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('chipman park')
      ),
  },
  {
    label: 'Jeff Lajoie — 354 Grout Rd, Perkinsville, VT',
    latitude: 43.4009575,
    longitude: -72.5254889,
    match: (c) =>
      (c.firstName.toLowerCase().includes('jeff') &&
        c.lastName.toLowerCase().includes('lajoie')) ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('grout')
      ),
  },
  {
    label: 'Tiffany Pimpinella — 172 Bear Hill Rd, Ludlow, VT',
    latitude: 43.3579961,
    longitude: -72.7138251,
    match: (c) =>
      (c.firstName.toLowerCase().includes('tiffany') &&
        c.lastName.toLowerCase().includes('pimpinella')) ||
      [c.defaultAddress, c.addressLine1].some((a) =>
        (a || '').toLowerCase().includes('bear hill')
      ),
  },
];

async function applyKnownSeeds() {
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      defaultAddress: true,
      addressLine1: true,
      latitude: true,
      longitude: true,
    },
  });

  for (const target of KNOWN_PROPERTIES) {
    const match = customers.find(target.match);
    if (!match) {
      console.warn(`⚠ No customer found for: ${target.label}`);
      continue;
    }

    if (
      match.latitude === target.latitude &&
      match.longitude === target.longitude
    ) {
      console.log(`✓ ${target.label} coordinates already set (${match.email})`);
      continue;
    }

    await prisma.customer.update({
      where: { id: match.id },
      data: {
        latitude: target.latitude,
        longitude: target.longitude,
        updatedAt: new Date(),
      },
    });
    console.log(`✓ ${target.label} → ${target.latitude}, ${target.longitude} (${match.email})`);
  }
}

async function geocodeRemaining() {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  GOOGLE_MAPS_API_KEY is not set — geocoding cannot continue.     ║
║                                                                  ║
║  Brian needs to:                                                 ║
║  1. Create a Google Cloud project                                ║
║  2. Enable Maps JavaScript API + Geocoding API                   ║
║  3. Add GOOGLE_MAPS_API_KEY to .env.local and Vercel             ║
║  4. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for the admin map UI     ║
╚══════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  const customers = await prisma.customer.findMany({
    where: {
      latitude: null,
      OR: [
        { defaultAddress: { not: null } },
        { addressLine1: { not: null } },
      ],
    },
    select: {
      id: true,
      email: true,
      defaultAddress: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
    },
  });

  console.log(`\nGeocoding ${customers.length} customer(s) without coordinates…`);

  for (const customer of customers) {
    const address = formatCustomerAddress(customer);
    if (!address) {
      console.warn(`⚠ Skipping ${customer.email} — no usable address`);
      continue;
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      console.warn(`⚠ Geocode failed for ${customer.email}: ${address}`);
      continue;
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        updatedAt: new Date(),
      },
    });
    console.log(`✓ ${customer.email} → ${coords.latitude}, ${coords.longitude}`);

    // Respect Geocoding API rate limits
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  console.log('Applying known property coordinates…');
  await applyKnownSeeds();
  await geocodeRemaining();
  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
