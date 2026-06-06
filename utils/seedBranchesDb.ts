/**
 * Database Branch Seeding Script
 * 
 * Seeds all VelocityMaid branches into the database using Prisma:
 * - New Jersey (ACTIVE) - USA
 * - Vermont (ACTIVE) - USA
 * - Port Antonio (ACTIVE) - Jamaica
 */

import { prisma } from '@/lib/prisma';
import { BranchStatus } from '@prisma/client';

// Import ZIP code data from the original seed file
const NJ_ZIP_CODES = [
  { zip: '07101', city: 'Newark', state: 'NJ' },
  { zip: '07102', city: 'Newark', state: 'NJ' },
  { zip: '07103', city: 'Newark', state: 'NJ' },
  { zip: '07104', city: 'Newark', state: 'NJ' },
  { zip: '07105', city: 'Newark', state: 'NJ' },
  { zip: '07106', city: 'Newark', state: 'NJ' },
  { zip: '07107', city: 'Newark', state: 'NJ' },
  { zip: '07108', city: 'Newark', state: 'NJ' },
  { zip: '07112', city: 'Newark', state: 'NJ' },
  { zip: '07114', city: 'Newark', state: 'NJ' },
  { zip: '07302', city: 'Jersey City', state: 'NJ' },
  { zip: '07303', city: 'Jersey City', state: 'NJ' },
  { zip: '07304', city: 'Jersey City', state: 'NJ' },
  { zip: '07305', city: 'Jersey City', state: 'NJ' },
  { zip: '07306', city: 'Jersey City', state: 'NJ' },
  { zip: '07307', city: 'Jersey City', state: 'NJ' },
  { zip: '07308', city: 'Jersey City', state: 'NJ' },
  { zip: '07310', city: 'Jersey City', state: 'NJ' },
  { zip: '07311', city: 'Jersey City', state: 'NJ' },
  { zip: '07501', city: 'Paterson', state: 'NJ' },
  { zip: '07502', city: 'Paterson', state: 'NJ' },
  { zip: '07503', city: 'Paterson', state: 'NJ' },
  { zip: '07504', city: 'Paterson', state: 'NJ' },
  { zip: '07505', city: 'Paterson', state: 'NJ' },
  { zip: '07509', city: 'Paterson', state: 'NJ' },
  { zip: '07510', city: 'Paterson', state: 'NJ' },
  { zip: '07513', city: 'Paterson', state: 'NJ' },
  { zip: '07514', city: 'Paterson', state: 'NJ' },
  { zip: '07522', city: 'Paterson', state: 'NJ' },
  { zip: '07524', city: 'Paterson', state: 'NJ' },
  { zip: '07533', city: 'Paterson', state: 'NJ' },
  { zip: '07543', city: 'Paterson', state: 'NJ' },
  { zip: '07544', city: 'Paterson', state: 'NJ' },
  { zip: '07201', city: 'Elizabeth', state: 'NJ' },
  { zip: '07202', city: 'Elizabeth', state: 'NJ' },
  { zip: '07206', city: 'Elizabeth', state: 'NJ' },
  { zip: '07208', city: 'Elizabeth', state: 'NJ' },
  { zip: '08817', city: 'Edison', state: 'NJ' },
  { zip: '08818', city: 'Edison', state: 'NJ' },
  { zip: '08820', city: 'Edison', state: 'NJ' },
  { zip: '08837', city: 'Edison', state: 'NJ' },
  { zip: '07030', city: 'Hoboken', state: 'NJ' },
  { zip: '07011', city: 'Clifton', state: 'NJ' },
  { zip: '07012', city: 'Clifton', state: 'NJ' },
  { zip: '07013', city: 'Clifton', state: 'NJ' },
  { zip: '07014', city: 'Clifton', state: 'NJ' },
  { zip: '07015', city: 'Clifton', state: 'NJ' },
];

const VT_ZIP_CODES = [
  { zip: '05149', city: 'Ludlow', state: 'VT' },
  { zip: '05150', city: 'Ludlow', state: 'VT' },
  { zip: '05151', city: 'Ludlow', state: 'VT' },
  { zip: '05152', city: 'Ludlow', state: 'VT' },
  { zip: '05153', city: 'Ludlow', state: 'VT' },
  { zip: '05154', city: 'Ludlow', state: 'VT' },
  { zip: '05155', city: 'Ludlow', state: 'VT' },
  { zip: '05156', city: 'Ludlow', state: 'VT' },
  { zip: '05157', city: 'Ludlow', state: 'VT' },
  { zip: '05158', city: 'Ludlow', state: 'VT' },
  { zip: '05159', city: 'Ludlow', state: 'VT' },
  { zip: '05160', city: 'Ludlow', state: 'VT' },
  { zip: '05401', city: 'Burlington', state: 'VT' },
  { zip: '05402', city: 'Burlington', state: 'VT' },
  { zip: '05403', city: 'Burlington', state: 'VT' },
  { zip: '05404', city: 'Burlington', state: 'VT' },
  { zip: '05405', city: 'Burlington', state: 'VT' },
  { zip: '05406', city: 'Burlington', state: 'VT' },
  { zip: '05407', city: 'Burlington', state: 'VT' },
  { zip: '05408', city: 'Burlington', state: 'VT' },
  { zip: '05601', city: 'Montpelier', state: 'VT' },
  { zip: '05602', city: 'Montpelier', state: 'VT' },
  { zip: '05603', city: 'Montpelier', state: 'VT' },
  { zip: '05604', city: 'Montpelier', state: 'VT' },
  { zip: '05609', city: 'Montpelier', state: 'VT' },
];

const PORT_ANTONIO_ZIP_CODES = [
  { zip: '00000', city: 'Port Antonio', state: 'Portland' }, // Placeholder - need actual Jamaica postal codes
];

/**
 * Seed New Jersey Branch
 */
async function seedNewJersey() {
  // Check if branch already exists
  const existing = await prisma.branch.findUnique({
    where: { slug: 'new-jersey' },
  });

  if (existing) {
    console.log('✅ New Jersey branch already exists, updating...');
    // Update to ensure it's ACTIVE and has correct country
    const branch = await prisma.branch.update({
      where: { slug: 'new-jersey' },
      data: {
        country: 'United States',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Update service areas
    await prisma.branchServiceArea.deleteMany({
      where: { branchId: branch.id },
    });
    await prisma.branchServiceArea.createMany({
      data: NJ_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-nj-${branch.id}-${index}-${Date.now()}`,
        branchId: branch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return branch;
  }

  // Create branch with all related data in a transaction
  const branch = await prisma.$transaction(async (tx) => {
    // Create pricing model
    const pricingModel = await tx.pricingModel.create({
      data: {
        id: `pricing-nj-${Date.now()}`,
        name: 'New Jersey Standard',
        billingType: 'FLAT',
        currency: 'USD',
        baseRate: 120,
        extraHourRate: 30,
        minHours: null,
        internalNotes: 'Standard pricing model for New Jersey',
        updatedAt: new Date(),
      },
    });

    // Create branch
    const newBranch = await tx.branch.create({
      data: {
        id: `branch-nj-${Date.now()}`,
        name: 'New Jersey',
        slug: 'new-jersey',
        country: 'United States',
        state: 'New Jersey',
        city: 'Newark',
        regionLabel: 'New Jersey',
        timezone: 'America/New_York',
        primaryPhone: '(973) 280-9190',
        whatsappNumber: '19732809190',
        managerId: null,
        pricingModelId: pricingModel.id,
        status: 'ACTIVE',
        currency: 'USD',
        updatedAt: new Date(),
      },
    });

    // Create service areas
    await tx.branchServiceArea.createMany({
      data: NJ_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-nj-${newBranch.id}-${index}-${Date.now()}`,
        branchId: newBranch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    // Create service packages
    const timestamp = Date.now();
    await tx.branchServicePackage.createMany({
      data: [
        {
          id: `pkg-nj-${newBranch.id}-basic-${timestamp}`,
          branchId: newBranch.id,
          code: 'BASIC_CLEAN',
          name: 'Basic Clean',
          description: 'Perfect for regular maintenance cleaning',
          defaultDurationHours: 2,
          basePrice: 120,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-nj-${newBranch.id}-deep-${timestamp}`,
          branchId: newBranch.id,
          code: 'DEEP_CLEAN',
          name: 'Deep Clean',
          description: 'Thorough top-to-bottom cleaning service',
          defaultDurationHours: 4,
          basePrice: 220,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-nj-${newBranch.id}-move-${timestamp}`,
          branchId: newBranch.id,
          code: 'MOVE_IN_OUT',
          name: 'Move In/Out Clean',
          description: 'Complete property cleaning for transitions',
          defaultDurationHours: 6,
          basePrice: 320,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // Create branch config
    await tx.branchConfig.create({
      data: {
        id: `config-nj-${Date.now()}`,
        branchId: newBranch.id,
        bookingEmail: 'bookings@velocitymaid.com',
        supportEmail: 'support@velocitymaid.com',
        maxDailyJobs: 50,
        updatedAt: new Date(),
      },
    });

    // Create automation config
    await tx.branchAutomationConfig.create({
      data: {
        id: `automation-nj-${Date.now()}`,
        branchId: newBranch.id,
        bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
        reminderWebhookUrl: null,
        reviewWebhookUrl: null,
        updatedAt: new Date(),
      },
    });

    return newBranch;
  });

  return branch;
}

/**
 * Seed Vermont Branch
 */
async function seedVermont() {
  // Check if branch already exists
  const existing = await prisma.branch.findUnique({
    where: { slug: 'vermont' },
  });

  if (existing) {
    console.log('✅ Vermont branch already exists, updating...');
    // Update to ensure it's ACTIVE and has correct country
    const branch = await prisma.branch.update({
      where: { slug: 'vermont' },
      data: {
        name: 'Vermont — Okemo Valley',
        regionLabel: 'Okemo Valley',
        country: 'United States',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Update service areas
    await prisma.branchServiceArea.deleteMany({
      where: { branchId: branch.id },
    });
    await prisma.branchServiceArea.createMany({
      data: VT_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-vt-${branch.id}-${index}-${Date.now()}`,
        branchId: branch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return branch;
  }

  // Create branch with all related data in a transaction
  const branch = await prisma.$transaction(async (tx) => {
    // Create pricing model
    const pricingModel = await tx.pricingModel.create({
      data: {
        id: `pricing-vt-${Date.now()}`,
        name: 'Vermont Standard',
        billingType: 'FLAT',
        currency: 'USD',
        baseRate: 120,
        extraHourRate: 30,
        minHours: null,
        internalNotes: 'Standard pricing model for Vermont',
        updatedAt: new Date(),
      },
    });

    // Create branch
    const newBranch = await tx.branch.create({
      data: {
        id: `branch-vt-${Date.now()}`,
        name: 'Vermont — Okemo Valley',
        slug: 'vermont',
        country: 'United States',
        state: 'Vermont',
        city: 'Ludlow',
        regionLabel: 'Okemo Valley',
        timezone: 'America/New_York',
        primaryPhone: '(802) 733-5348',
        whatsappNumber: '18027335348',
        managerId: null,
        pricingModelId: pricingModel.id,
        status: 'ACTIVE',
        currency: 'USD',
        updatedAt: new Date(),
      },
    });

    // Create service areas
    await tx.branchServiceArea.createMany({
      data: VT_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-vt-${newBranch.id}-${index}-${Date.now()}`,
        branchId: newBranch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    // Create service packages
    const timestampVt = Date.now();
    await tx.branchServicePackage.createMany({
      data: [
        {
          id: `pkg-vt-${newBranch.id}-basic-${timestampVt}`,
          branchId: newBranch.id,
          code: 'BASIC_CLEAN',
          name: 'Basic Clean',
          description: 'Perfect for regular maintenance cleaning',
          defaultDurationHours: 2,
          basePrice: 120,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-vt-${newBranch.id}-deep-${timestampVt}`,
          branchId: newBranch.id,
          code: 'DEEP_CLEAN',
          name: 'Deep Clean',
          description: 'Thorough top-to-bottom cleaning service',
          defaultDurationHours: 4,
          basePrice: 220,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-vt-${newBranch.id}-move-${timestampVt}`,
          branchId: newBranch.id,
          code: 'MOVE_IN_OUT',
          name: 'Move In/Out Clean',
          description: 'Complete property cleaning for transitions',
          defaultDurationHours: 6,
          basePrice: 320,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // Create branch config
    await tx.branchConfig.create({
      data: {
        id: `config-vt-${Date.now()}`,
        branchId: newBranch.id,
        bookingEmail: 'bookings@velocitymaid.com',
        supportEmail: 'support@velocitymaid.com',
          maxDailyJobs: 30,
          updatedAt: new Date(),
      },
    });

    // Create automation config
    await tx.branchAutomationConfig.create({
      data: {
        id: `automation-vt-${Date.now()}`,
        branchId: newBranch.id,
        bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
        reminderWebhookUrl: null,
        reviewWebhookUrl: null,
        updatedAt: new Date(),
      },
    });

    return newBranch;
  });

  return branch;
}

/**
 * Seed Port Antonio Branch (Jamaica) - Set to ACTIVE for bookings
 */
async function seedPortAntonio() {
  // Check if branch already exists
  const existing = await prisma.branch.findUnique({
    where: { slug: 'port-antonio' },
  });

  if (existing) {
    console.log('✅ Port Antonio branch already exists, updating to ACTIVE...');
    // Update to ensure it's ACTIVE and has correct country
    const branch = await prisma.branch.update({
      where: { slug: 'port-antonio' },
      data: {
        country: 'Jamaica',
        status: 'ACTIVE', // Changed from COMING_SOON to ACTIVE
        updatedAt: new Date(),
      },
    });

    // Update service areas
    await prisma.branchServiceArea.deleteMany({
      where: { branchId: branch.id },
    });
    await prisma.branchServiceArea.createMany({
      data: PORT_ANTONIO_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-ja-${branch.id}-${index}-${Date.now()}`,
        branchId: branch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    return branch;
  }

  // Create branch with all related data in a transaction
  const branch = await prisma.$transaction(async (tx) => {
    // Create pricing model
    const pricingModel = await tx.pricingModel.create({
      data: {
        id: `pricing-ja-${Date.now()}`,
        name: 'Port Antonio Standard',
        billingType: 'FLAT',
        currency: 'USD',
        baseRate: 100,
        extraHourRate: 25,
        minHours: null,
        internalNotes: 'Standard pricing model for Port Antonio, Jamaica',
        updatedAt: new Date(),
      },
    });

    // Create branch
    const newBranch = await tx.branch.create({
      data: {
        id: `branch-ja-${Date.now()}`,
        name: 'Port Antonio',
        slug: 'port-antonio',
        country: 'Jamaica',
        state: 'Portland',
        city: 'Port Antonio',
        regionLabel: 'Portland Parish',
        timezone: 'America/Jamaica',
        primaryPhone: '+1 (876) 555-0100',
        whatsappNumber: '18765550100',
        managerId: null,
        pricingModelId: pricingModel.id,
        status: 'ACTIVE', // Set to ACTIVE for bookings
        currency: 'USD',
        updatedAt: new Date(),
      },
    });

    // Create service areas
    await tx.branchServiceArea.createMany({
      data: PORT_ANTONIO_ZIP_CODES.map(({ zip, city, state }, index) => ({
        id: `area-ja-${newBranch.id}-${index}-${Date.now()}`,
        branchId: newBranch.id,
        zipCode: zip,
        priority: 1,
        city,
        state,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    // Create service packages
    const timestamp = Date.now();
    await tx.branchServicePackage.createMany({
      data: [
        {
          id: `pkg-ja-${newBranch.id}-basic-${timestamp}`,
          branchId: newBranch.id,
          code: 'BASIC_CLEAN',
          name: 'Basic Clean',
          description: 'Perfect for regular maintenance cleaning',
          defaultDurationHours: 2,
          basePrice: 100,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-ja-${newBranch.id}-deep-${timestamp}`,
          branchId: newBranch.id,
          code: 'DEEP_CLEAN',
          name: 'Deep Clean',
          description: 'Thorough top-to-bottom cleaning service',
          defaultDurationHours: 4,
          basePrice: 180,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
        {
          id: `pkg-ja-${newBranch.id}-move-${timestamp}`,
          branchId: newBranch.id,
          code: 'MOVE_IN_OUT',
          name: 'Move In/Out Clean',
          description: 'Complete property cleaning for transitions',
          defaultDurationHours: 6,
          basePrice: 260,
          isActive: true,
          currency: 'USD',
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // Create branch config
    await tx.branchConfig.create({
      data: {
        id: `config-ja-${Date.now()}`,
        branchId: newBranch.id,
        bookingEmail: 'portantonio@velocitymaid.com',
        supportEmail: 'support@velocitymaid.com',
          maxDailyJobs: 20,
          updatedAt: new Date(),
      },
    });

    // Create automation config
    await tx.branchAutomationConfig.create({
      data: {
        id: `automation-ja-${Date.now()}`,
        branchId: newBranch.id,
        bookingWebhookUrl: null,
        reminderWebhookUrl: null,
        reviewWebhookUrl: null,
        updatedAt: new Date(),
      },
    });

    return newBranch;
  });

  return branch;
}

/**
 * Main seed function
 */
export async function seedAllBranchesDb() {
  console.log('🌱 Seeding branches into database...');
  
  try {
    const nj = await seedNewJersey();
    console.log(`✅ Seeded New Jersey branch: ${nj.slug} (${nj.id})`);
    
    const vt = await seedVermont();
    console.log(`✅ Seeded Vermont branch: ${vt.slug} (${vt.id})`);
    
    const portAntonio = await seedPortAntonio();
    console.log(`✅ Seeded Port Antonio branch: ${portAntonio.slug} (${portAntonio.id})`);
    
    console.log('🎉 All branches seeded successfully!');
    
    return {
      newJersey: nj,
      vermont: vt,
      portAntonio,
    };
  } catch (error: any) {
    console.error('❌ Error seeding branches:', error);
    throw error;
  }
}
