/**
 * Branch Seeding Script
 * 
 * Seeds all VelocityMaid branches with complete configuration:
 * - New Jersey (ACTIVE)
 * - Vermont (ACTIVE)
 * - Boston (ACTIVE)
 * - New York City (ACTIVE)
 * - Port Antonio (COMING_SOON)
 */

import {
  createBranch,
  createBranchServiceArea,
  createPricingModel,
  createBranchServicePackage,
  createBranchConfig,
  createBranchAutomationConfig,
  createBranchLandingContent,
  createBranchPayoutRules,
  type Branch,
  type PricingModel,
} from './branchData';

/**
 * New Jersey ZIP codes (major cities)
 */
const NJ_ZIP_CODES = [
  // Newark
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
  // Jersey City
  { zip: '07302', city: 'Jersey City', state: 'NJ' },
  { zip: '07303', city: 'Jersey City', state: 'NJ' },
  { zip: '07304', city: 'Jersey City', state: 'NJ' },
  { zip: '07305', city: 'Jersey City', state: 'NJ' },
  { zip: '07306', city: 'Jersey City', state: 'NJ' },
  { zip: '07307', city: 'Jersey City', state: 'NJ' },
  { zip: '07308', city: 'Jersey City', state: 'NJ' },
  { zip: '07310', city: 'Jersey City', state: 'NJ' },
  { zip: '07311', city: 'Jersey City', state: 'NJ' },
  // Paterson
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
  // Elizabeth
  { zip: '07201', city: 'Elizabeth', state: 'NJ' },
  { zip: '07202', city: 'Elizabeth', state: 'NJ' },
  { zip: '07206', city: 'Elizabeth', state: 'NJ' },
  { zip: '07208', city: 'Elizabeth', state: 'NJ' },
  // Edison
  { zip: '08817', city: 'Edison', state: 'NJ' },
  { zip: '08818', city: 'Edison', state: 'NJ' },
  { zip: '08820', city: 'Edison', state: 'NJ' },
  { zip: '08837', city: 'Edison', state: 'NJ' },
  // Hoboken
  { zip: '07030', city: 'Hoboken', state: 'NJ' },
  // Clifton
  { zip: '07011', city: 'Clifton', state: 'NJ' },
  { zip: '07012', city: 'Clifton', state: 'NJ' },
  { zip: '07013', city: 'Clifton', state: 'NJ' },
  { zip: '07014', city: 'Clifton', state: 'NJ' },
  { zip: '07015', city: 'Clifton', state: 'NJ' },
];

/**
 * Vermont ZIP codes (major areas)
 */
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

/**
 * Boston ZIP codes (major areas)
 */
const BOSTON_ZIP_CODES = [
  { zip: '02101', city: 'Boston', state: 'MA' },
  { zip: '02102', city: 'Boston', state: 'MA' },
  { zip: '02103', city: 'Boston', state: 'MA' },
  { zip: '02104', city: 'Boston', state: 'MA' },
  { zip: '02105', city: 'Boston', state: 'MA' },
  { zip: '02106', city: 'Boston', state: 'MA' },
  { zip: '02107', city: 'Boston', state: 'MA' },
  { zip: '02108', city: 'Boston', state: 'MA' },
  { zip: '02109', city: 'Boston', state: 'MA' },
  { zip: '02110', city: 'Boston', state: 'MA' },
  { zip: '02111', city: 'Boston', state: 'MA' },
  { zip: '02112', city: 'Boston', state: 'MA' },
  { zip: '02113', city: 'Boston', state: 'MA' },
  { zip: '02114', city: 'Boston', state: 'MA' },
  { zip: '02115', city: 'Boston', state: 'MA' },
  { zip: '02116', city: 'Boston', state: 'MA' },
  { zip: '02117', city: 'Boston', state: 'MA' },
  { zip: '02118', city: 'Boston', state: 'MA' },
  { zip: '02119', city: 'Boston', state: 'MA' },
  { zip: '02120', city: 'Boston', state: 'MA' },
  { zip: '02121', city: 'Boston', state: 'MA' },
  { zip: '02122', city: 'Boston', state: 'MA' },
  { zip: '02123', city: 'Boston', state: 'MA' },
  { zip: '02124', city: 'Boston', state: 'MA' },
  { zip: '02125', city: 'Boston', state: 'MA' },
  { zip: '02126', city: 'Boston', state: 'MA' },
  { zip: '02127', city: 'Boston', state: 'MA' },
  { zip: '02128', city: 'Boston', state: 'MA' },
  { zip: '02129', city: 'Boston', state: 'MA' },
  { zip: '02130', city: 'Boston', state: 'MA' },
  { zip: '02131', city: 'Boston', state: 'MA' },
  { zip: '02132', city: 'Boston', state: 'MA' },
  { zip: '02133', city: 'Boston', state: 'MA' },
  { zip: '02134', city: 'Boston', state: 'MA' },
  { zip: '02135', city: 'Boston', state: 'MA' },
  { zip: '02136', city: 'Boston', state: 'MA' },
  { zip: '02137', city: 'Boston', state: 'MA' },
  { zip: '02138', city: 'Cambridge', state: 'MA' },
  { zip: '02139', city: 'Cambridge', state: 'MA' },
  { zip: '02140', city: 'Cambridge', state: 'MA' },
  { zip: '02141', city: 'Cambridge', state: 'MA' },
  { zip: '02142', city: 'Cambridge', state: 'MA' },
  { zip: '02143', city: 'Somerville', state: 'MA' },
  { zip: '02144', city: 'Somerville', state: 'MA' },
  { zip: '02145', city: 'Somerville', state: 'MA' },
];

/**
 * NYC ZIP codes (major boroughs)
 */
const NYC_ZIP_CODES = [
  // Manhattan
  { zip: '10001', city: 'New York', state: 'NY' },
  { zip: '10002', city: 'New York', state: 'NY' },
  { zip: '10003', city: 'New York', state: 'NY' },
  { zip: '10004', city: 'New York', state: 'NY' },
  { zip: '10005', city: 'New York', state: 'NY' },
  { zip: '10006', city: 'New York', state: 'NY' },
  { zip: '10007', city: 'New York', state: 'NY' },
  { zip: '10009', city: 'New York', state: 'NY' },
  { zip: '10010', city: 'New York', state: 'NY' },
  { zip: '10011', city: 'New York', state: 'NY' },
  { zip: '10012', city: 'New York', state: 'NY' },
  { zip: '10013', city: 'New York', state: 'NY' },
  { zip: '10014', city: 'New York', state: 'NY' },
  { zip: '10016', city: 'New York', state: 'NY' },
  { zip: '10017', city: 'New York', state: 'NY' },
  { zip: '10018', city: 'New York', state: 'NY' },
  { zip: '10019', city: 'New York', state: 'NY' },
  { zip: '10020', city: 'New York', state: 'NY' },
  { zip: '10021', city: 'New York', state: 'NY' },
  { zip: '10022', city: 'New York', state: 'NY' },
  { zip: '10023', city: 'New York', state: 'NY' },
  { zip: '10024', city: 'New York', state: 'NY' },
  { zip: '10025', city: 'New York', state: 'NY' },
  { zip: '10026', city: 'New York', state: 'NY' },
  { zip: '10027', city: 'New York', state: 'NY' },
  { zip: '10028', city: 'New York', state: 'NY' },
  { zip: '10029', city: 'New York', state: 'NY' },
  { zip: '10030', city: 'New York', state: 'NY' },
  { zip: '10031', city: 'New York', state: 'NY' },
  { zip: '10032', city: 'New York', state: 'NY' },
  { zip: '10033', city: 'New York', state: 'NY' },
  { zip: '10034', city: 'New York', state: 'NY' },
  { zip: '10035', city: 'New York', state: 'NY' },
  { zip: '10036', city: 'New York', state: 'NY' },
  { zip: '10037', city: 'New York', state: 'NY' },
  { zip: '10038', city: 'New York', state: 'NY' },
  { zip: '10039', city: 'New York', state: 'NY' },
  { zip: '10040', city: 'New York', state: 'NY' },
  { zip: '10044', city: 'New York', state: 'NY' },
  { zip: '10065', city: 'New York', state: 'NY' },
  { zip: '10069', city: 'New York', state: 'NY' },
  { zip: '10075', city: 'New York', state: 'NY' },
  // Brooklyn
  { zip: '11201', city: 'Brooklyn', state: 'NY' },
  { zip: '11202', city: 'Brooklyn', state: 'NY' },
  { zip: '11203', city: 'Brooklyn', state: 'NY' },
  { zip: '11204', city: 'Brooklyn', state: 'NY' },
  { zip: '11205', city: 'Brooklyn', state: 'NY' },
  { zip: '11206', city: 'Brooklyn', state: 'NY' },
  { zip: '11207', city: 'Brooklyn', state: 'NY' },
  { zip: '11208', city: 'Brooklyn', state: 'NY' },
  { zip: '11209', city: 'Brooklyn', state: 'NY' },
  { zip: '11210', city: 'Brooklyn', state: 'NY' },
  { zip: '11211', city: 'Brooklyn', state: 'NY' },
  { zip: '11212', city: 'Brooklyn', state: 'NY' },
  { zip: '11213', city: 'Brooklyn', state: 'NY' },
  { zip: '11214', city: 'Brooklyn', state: 'NY' },
  { zip: '11215', city: 'Brooklyn', state: 'NY' },
  { zip: '11216', city: 'Brooklyn', state: 'NY' },
  { zip: '11217', city: 'Brooklyn', state: 'NY' },
  { zip: '11218', city: 'Brooklyn', state: 'NY' },
  { zip: '11219', city: 'Brooklyn', state: 'NY' },
  { zip: '11220', city: 'Brooklyn', state: 'NY' },
  { zip: '11221', city: 'Brooklyn', state: 'NY' },
  { zip: '11222', city: 'Brooklyn', state: 'NY' },
  { zip: '11223', city: 'Brooklyn', state: 'NY' },
  { zip: '11224', city: 'Brooklyn', state: 'NY' },
  { zip: '11225', city: 'Brooklyn', state: 'NY' },
  { zip: '11226', city: 'Brooklyn', state: 'NY' },
  { zip: '11228', city: 'Brooklyn', state: 'NY' },
  { zip: '11229', city: 'Brooklyn', state: 'NY' },
  { zip: '11230', city: 'Brooklyn', state: 'NY' },
  { zip: '11231', city: 'Brooklyn', state: 'NY' },
  { zip: '11232', city: 'Brooklyn', state: 'NY' },
  { zip: '11233', city: 'Brooklyn', state: 'NY' },
  { zip: '11234', city: 'Brooklyn', state: 'NY' },
  { zip: '11235', city: 'Brooklyn', state: 'NY' },
  { zip: '11236', city: 'Brooklyn', state: 'NY' },
  { zip: '11237', city: 'Brooklyn', state: 'NY' },
  { zip: '11238', city: 'Brooklyn', state: 'NY' },
  { zip: '11239', city: 'Brooklyn', state: 'NY' },
  // Queens
  { zip: '11101', city: 'Long Island City', state: 'NY' },
  { zip: '11102', city: 'Long Island City', state: 'NY' },
  { zip: '11103', city: 'Long Island City', state: 'NY' },
  { zip: '11104', city: 'Long Island City', state: 'NY' },
  { zip: '11105', city: 'Long Island City', state: 'NY' },
  { zip: '11106', city: 'Long Island City', state: 'NY' },
  { zip: '11354', city: 'Flushing', state: 'NY' },
  { zip: '11355', city: 'Flushing', state: 'NY' },
  { zip: '11356', city: 'Flushing', state: 'NY' },
  { zip: '11357', city: 'Flushing', state: 'NY' },
  { zip: '11358', city: 'Flushing', state: 'NY' },
  { zip: '11360', city: 'Flushing', state: 'NY' },
  { zip: '11361', city: 'Flushing', state: 'NY' },
  { zip: '11362', city: 'Flushing', state: 'NY' },
  { zip: '11363', city: 'Flushing', state: 'NY' },
  { zip: '11364', city: 'Flushing', state: 'NY' },
  { zip: '11365', city: 'Flushing', state: 'NY' },
  { zip: '11366', city: 'Flushing', state: 'NY' },
  { zip: '11367', city: 'Flushing', state: 'NY' },
  { zip: '11368', city: 'Flushing', state: 'NY' },
  { zip: '11369', city: 'Flushing', state: 'NY' },
  { zip: '11370', city: 'Flushing', state: 'NY' },
  { zip: '11371', city: 'Flushing', state: 'NY' },
  { zip: '11372', city: 'Flushing', state: 'NY' },
  { zip: '11373', city: 'Flushing', state: 'NY' },
  { zip: '11374', city: 'Flushing', state: 'NY' },
  { zip: '11375', city: 'Flushing', state: 'NY' },
  { zip: '11377', city: 'Flushing', state: 'NY' },
  { zip: '11378', city: 'Flushing', state: 'NY' },
  { zip: '11379', city: 'Flushing', state: 'NY' },
  { zip: '11380', city: 'Flushing', state: 'NY' },
  { zip: '11381', city: 'Flushing', state: 'NY' },
  { zip: '11385', city: 'Flushing', state: 'NY' },
  // Bronx
  { zip: '10451', city: 'Bronx', state: 'NY' },
  { zip: '10452', city: 'Bronx', state: 'NY' },
  { zip: '10453', city: 'Bronx', state: 'NY' },
  { zip: '10454', city: 'Bronx', state: 'NY' },
  { zip: '10455', city: 'Bronx', state: 'NY' },
  { zip: '10456', city: 'Bronx', state: 'NY' },
  { zip: '10457', city: 'Bronx', state: 'NY' },
  { zip: '10458', city: 'Bronx', state: 'NY' },
  { zip: '10459', city: 'Bronx', state: 'NY' },
  { zip: '10460', city: 'Bronx', state: 'NY' },
  { zip: '10461', city: 'Bronx', state: 'NY' },
  { zip: '10462', city: 'Bronx', state: 'NY' },
  { zip: '10463', city: 'Bronx', state: 'NY' },
  { zip: '10464', city: 'Bronx', state: 'NY' },
  { zip: '10465', city: 'Bronx', state: 'NY' },
  { zip: '10466', city: 'Bronx', state: 'NY' },
  { zip: '10467', city: 'Bronx', state: 'NY' },
  { zip: '10468', city: 'Bronx', state: 'NY' },
  { zip: '10469', city: 'Bronx', state: 'NY' },
  { zip: '10470', city: 'Bronx', state: 'NY' },
  { zip: '10471', city: 'Bronx', state: 'NY' },
  { zip: '10472', city: 'Bronx', state: 'NY' },
  { zip: '10473', city: 'Bronx', state: 'NY' },
  { zip: '10474', city: 'Bronx', state: 'NY' },
  { zip: '10475', city: 'Bronx', state: 'NY' },
];

/**
 * Port Antonio ZIP codes (Jamaica)
 */
const PORT_ANTONIO_ZIP_CODES = [
  { zip: '00000', city: 'Port Antonio', state: 'Portland' }, // Placeholder - need actual Jamaica postal codes
];

/**
 * Create pricing model for a branch
 */
function createStandardPricingModel(name: string): PricingModel {
  return createPricingModel({
    name,
    billingType: 'FLAT',
    currency: 'USD',
    baseRate: 120, // Base rate for basic clean
    extraHourRate: 30,
    minHours: null,
    internalNotes: `Standard pricing model for ${name}`,
  });
}

/**
 * Seed New Jersey Branch
 */
function seedNewJersey() {
  // Create pricing model
  const pricingModel = createStandardPricingModel('New Jersey Standard');
  
  // Create branch
  const branch = createBranch({
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
  });

  // Create service areas
  NJ_ZIP_CODES.forEach(({ zip, city, state }, index) => {
    createBranchServiceArea({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city,
      state,
    });
  });

  // Create service packages
  createBranchServicePackage({
    branchId: branch.id,
    code: 'BASIC_CLEAN',
    name: 'Basic Clean',
    description: 'Perfect for regular maintenance cleaning',
    defaultDurationHours: 2,
    basePrice: 120,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'DEEP_CLEAN',
    name: 'Deep Clean',
    description: 'Thorough top-to-bottom cleaning service',
    defaultDurationHours: 4,
    basePrice: 220,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'MOVE_IN_OUT',
    name: 'Move In/Out Clean',
    description: 'Complete property cleaning for transitions',
    defaultDurationHours: 6,
    basePrice: 320,
    isActive: true,
  });

  // Create config
  createBranchConfig({
    branchId: branch.id,
    bookingEmail: 'bookings@velocitymaid.com',
    supportEmail: 'support@velocitymaid.com',
    maxDailyJobs: 50,
    whatsappTemplateConfig: null,
    zapierHooks: null,
    operationsFlags: null,
  });

  // Create automation config
  createBranchAutomationConfig({
    branchId: branch.id,
    bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
    reminderWebhookUrl: null,
    reviewWebhookUrl: null,
    whatsappTemplateBooking: null,
    whatsappTemplateReminder: null,
    whatsappTemplateReview: null,
  });

  // Create landing content
  createBranchLandingContent({
    branchId: branch.id,
    headline: 'Professional Cleaning Services in New Jersey',
    subheadline: 'Trusted by families across Newark, Jersey City, and beyond',
    heroImageUrl: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    localCtaLabel: 'Book Your New Jersey Cleaning',
    seoTitle: 'VelocityMaid | Professional Cleaning Services in New Jersey',
    seoDescription: 'VelocityMaid provides reliable home and apartment cleaning services across New Jersey, specializing in move-in/out cleaning, deep cleaning, and maintenance cleaning.',
    testimonials: [
      {
        name: 'Sarah J.',
        location: 'Newark, NJ',
        text: 'VelocityMaid transformed my home! Their attention to detail is incredible.',
        rating: 5,
      },
      {
        name: 'Michael C.',
        location: 'Jersey City, NJ',
        text: 'As a busy professional, VelocityMaid has been a lifesaver. They\'re reliable, thorough, and professional.',
        rating: 5,
      },
    ],
    faqEntries: [
      {
        question: 'What areas do you serve in New Jersey?',
        answer: 'We serve all of New Jersey, including Newark, Jersey City, Paterson, Elizabeth, Edison, and surrounding areas.',
      },
      {
        question: 'How quickly can you schedule a cleaning?',
        answer: 'We typically can schedule cleanings within 24-48 hours, depending on availability.',
      },
    ],
  });

  // Create payout rules
  createBranchPayoutRules({
    branchId: branch.id,
    baseRateType: 'PER_JOB',
    baseRateValue: 50,
    overtimeRules: null,
    tipHandling: 'PASS_THROUGH',
    franchiseFeePercentage: null,
  });

  return branch;
}

/**
 * Seed Vermont Branch
 */
function seedVermont() {
  const pricingModel = createStandardPricingModel('Vermont Standard');
  
  const branch = createBranch({
    name: 'Vermont',
    slug: 'vermont',
    country: 'United States',
    state: 'Vermont',
    city: 'Ludlow',
    regionLabel: 'Vermont',
    timezone: 'America/New_York',
    primaryPhone: '(802) 733-5348',
    whatsappNumber: '18027335348',
    managerId: null,
    pricingModelId: pricingModel.id,
    status: 'ACTIVE',
  });

  VT_ZIP_CODES.forEach(({ zip, city, state }) => {
    createBranchServiceArea({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city,
      state,
    });
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'BASIC_CLEAN',
    name: 'Basic Clean',
    description: 'Perfect for regular maintenance cleaning',
    defaultDurationHours: 2,
    basePrice: 120,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'DEEP_CLEAN',
    name: 'Deep Clean',
    description: 'Thorough top-to-bottom cleaning service',
    defaultDurationHours: 4,
    basePrice: 220,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'MOVE_IN_OUT',
    name: 'Move In/Out Clean',
    description: 'Complete property cleaning for transitions',
    defaultDurationHours: 6,
    basePrice: 320,
    isActive: true,
  });

  createBranchConfig({
    branchId: branch.id,
    bookingEmail: 'bookings@velocitymaid.com',
    supportEmail: 'support@velocitymaid.com',
    maxDailyJobs: 30,
    whatsappTemplateConfig: null,
    zapierHooks: null,
    operationsFlags: null,
  });

  createBranchAutomationConfig({
    branchId: branch.id,
    bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
    reminderWebhookUrl: null,
    reviewWebhookUrl: null,
    whatsappTemplateBooking: null,
    whatsappTemplateReminder: null,
    whatsappTemplateReview: null,
  });

  createBranchLandingContent({
    branchId: branch.id,
    headline: 'Professional Cleaning Services in Vermont',
    subheadline: 'Serving Ludlow, Burlington, and all of Vermont',
    heroImageUrl: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    localCtaLabel: 'Book Your Vermont Cleaning',
    seoTitle: 'VelocityMaid | Professional Cleaning Services in Vermont',
    seoDescription: 'VelocityMaid provides reliable home and apartment cleaning services throughout Vermont, with operations based in Ludlow.',
    testimonials: [],
    faqEntries: [
      {
        question: 'What areas do you serve in Vermont?',
        answer: 'We serve all of Vermont, including Ludlow, Burlington, Montpelier, and surrounding areas.',
      },
    ],
  });

  createBranchPayoutRules({
    branchId: branch.id,
    baseRateType: 'PER_JOB',
    baseRateValue: 50,
    overtimeRules: null,
    tipHandling: 'PASS_THROUGH',
    franchiseFeePercentage: null,
  });

  return branch;
}

/**
 * Seed Boston Branch
 */
function seedBoston() {
  const pricingModel = createStandardPricingModel('Boston Standard');
  
  const branch = createBranch({
    name: 'Boston',
    slug: 'boston',
    country: 'United States',
    state: 'Massachusetts',
    city: 'Boston',
    regionLabel: 'Boston Metro',
    timezone: 'America/New_York',
    primaryPhone: '(617) 555-0100',
    whatsappNumber: '16175550100',
    managerId: null,
    pricingModelId: pricingModel.id,
    status: 'ACTIVE',
  });

  BOSTON_ZIP_CODES.forEach(({ zip, city, state }) => {
    createBranchServiceArea({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city,
      state,
    });
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'BASIC_CLEAN',
    name: 'Basic Clean',
    description: 'Perfect for regular maintenance cleaning',
    defaultDurationHours: 2,
    basePrice: 140, // Higher pricing for Boston
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'DEEP_CLEAN',
    name: 'Deep Clean',
    description: 'Thorough top-to-bottom cleaning service',
    defaultDurationHours: 4,
    basePrice: 260,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'MOVE_IN_OUT',
    name: 'Move In/Out Clean',
    description: 'Complete property cleaning for transitions',
    defaultDurationHours: 6,
    basePrice: 380,
    isActive: true,
  });

  createBranchConfig({
    branchId: branch.id,
    bookingEmail: 'boston@velocitymaid.com',
    supportEmail: 'support@velocitymaid.com',
    maxDailyJobs: 60,
    whatsappTemplateConfig: null,
    zapierHooks: null,
    operationsFlags: null,
  });

  createBranchAutomationConfig({
    branchId: branch.id,
    bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
    reminderWebhookUrl: null,
    reviewWebhookUrl: null,
    whatsappTemplateBooking: null,
    whatsappTemplateReminder: null,
    whatsappTemplateReview: null,
  });

  createBranchLandingContent({
    branchId: branch.id,
    headline: 'Professional Cleaning Services in Boston',
    subheadline: 'Trusted by Boston families and professionals',
    heroImageUrl: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    localCtaLabel: 'Book Your Boston Cleaning',
    seoTitle: 'VelocityMaid | Professional Cleaning Services in Boston, MA',
    seoDescription: 'VelocityMaid provides reliable home and apartment cleaning services throughout Boston, Cambridge, and Somerville.',
    testimonials: [],
    faqEntries: [
      {
        question: 'What areas do you serve in Boston?',
        answer: 'We serve all of Boston, including Cambridge, Somerville, and surrounding areas.',
      },
    ],
  });

  createBranchPayoutRules({
    branchId: branch.id,
    baseRateType: 'PER_JOB',
    baseRateValue: 60,
    overtimeRules: null,
    tipHandling: 'PASS_THROUGH',
    franchiseFeePercentage: null,
  });

  return branch;
}

/**
 * Seed New York City Branch
 */
function seedNewYorkCity() {
  const pricingModel = createStandardPricingModel('NYC Standard');
  
  const branch = createBranch({
    name: 'New York City',
    slug: 'new-york-city',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    regionLabel: 'NYC Metro',
    timezone: 'America/New_York',
    primaryPhone: '(212) 555-0100',
    whatsappNumber: '12125550100',
    managerId: null,
    pricingModelId: pricingModel.id,
    status: 'ACTIVE',
  });

  NYC_ZIP_CODES.forEach(({ zip, city, state }) => {
    createBranchServiceArea({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city,
      state,
    });
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'BASIC_CLEAN',
    name: 'Basic Clean',
    description: 'Perfect for regular maintenance cleaning',
    defaultDurationHours: 2,
    basePrice: 150, // Higher pricing for NYC
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'DEEP_CLEAN',
    name: 'Deep Clean',
    description: 'Thorough top-to-bottom cleaning service',
    defaultDurationHours: 4,
    basePrice: 280,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'MOVE_IN_OUT',
    name: 'Move In/Out Clean',
    description: 'Complete property cleaning for transitions',
    defaultDurationHours: 6,
    basePrice: 400,
    isActive: true,
  });

  createBranchConfig({
    branchId: branch.id,
    bookingEmail: 'nyc@velocitymaid.com',
    supportEmail: 'support@velocitymaid.com',
    maxDailyJobs: 80,
    whatsappTemplateConfig: null,
    zapierHooks: null,
    operationsFlags: null,
  });

  createBranchAutomationConfig({
    branchId: branch.id,
    bookingWebhookUrl: process.env.ZAPIER_WEBHOOK_URL || null,
    reminderWebhookUrl: null,
    reviewWebhookUrl: null,
    whatsappTemplateBooking: null,
    whatsappTemplateReminder: null,
    whatsappTemplateReview: null,
  });

  createBranchLandingContent({
    branchId: branch.id,
    headline: 'Professional Cleaning Services in New York City',
    subheadline: 'Serving Manhattan, Brooklyn, Queens, and the Bronx',
    heroImageUrl: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    localCtaLabel: 'Book Your NYC Cleaning',
    seoTitle: 'VelocityMaid | Professional Cleaning Services in New York City',
    seoDescription: 'VelocityMaid provides reliable home and apartment cleaning services throughout New York City, including Manhattan, Brooklyn, Queens, and the Bronx.',
    testimonials: [],
    faqEntries: [
      {
        question: 'What areas do you serve in NYC?',
        answer: 'We serve all five boroughs: Manhattan, Brooklyn, Queens, the Bronx, and Staten Island.',
      },
    ],
  });

  createBranchPayoutRules({
    branchId: branch.id,
    baseRateType: 'PER_JOB',
    baseRateValue: 70,
    overtimeRules: null,
    tipHandling: 'PASS_THROUGH',
    franchiseFeePercentage: null,
  });

  return branch;
}

/**
 * Seed Port Antonio Branch (Coming Soon)
 */
function seedPortAntonio() {
  const pricingModel = createStandardPricingModel('Port Antonio Standard');
  
  const branch = createBranch({
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
    status: 'COMING_SOON',
  });

  // Note: Using placeholder ZIP codes - need actual Jamaica postal codes
  PORT_ANTONIO_ZIP_CODES.forEach(({ zip, city, state }) => {
    createBranchServiceArea({
      branchId: branch.id,
      zipCode: zip,
      priority: 1,
      city,
      state,
    });
  });

  // Still create packages for when it goes live
  createBranchServicePackage({
    branchId: branch.id,
    code: 'BASIC_CLEAN',
    name: 'Basic Clean',
    description: 'Perfect for regular maintenance cleaning',
    defaultDurationHours: 2,
    basePrice: 100, // Lower pricing for Jamaica
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'DEEP_CLEAN',
    name: 'Deep Clean',
    description: 'Thorough top-to-bottom cleaning service',
    defaultDurationHours: 4,
    basePrice: 180,
    isActive: true,
  });

  createBranchServicePackage({
    branchId: branch.id,
    code: 'MOVE_IN_OUT',
    name: 'Move In/Out Clean',
    description: 'Complete property cleaning for transitions',
    defaultDurationHours: 6,
    basePrice: 260,
    isActive: true,
  });

  createBranchConfig({
    branchId: branch.id,
    bookingEmail: 'portantonio@velocitymaid.com',
    supportEmail: 'support@velocitymaid.com',
    maxDailyJobs: 20,
    whatsappTemplateConfig: null,
    zapierHooks: null,
    operationsFlags: null,
  });

  createBranchAutomationConfig({
    branchId: branch.id,
    bookingWebhookUrl: null,
    reminderWebhookUrl: null,
    reviewWebhookUrl: null,
    whatsappTemplateBooking: null,
    whatsappTemplateReminder: null,
    whatsappTemplateReview: null,
  });

  createBranchLandingContent({
    branchId: branch.id,
    headline: 'VelocityMaid Coming Soon to Port Antonio',
    subheadline: 'We\'re expanding to Jamaica! Join our team or get notified when we launch.',
    heroImageUrl: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    localCtaLabel: 'Join Our Team',
    seoTitle: 'VelocityMaid | Coming Soon to Port Antonio, Jamaica',
    seoDescription: 'VelocityMaid is expanding to Port Antonio, Jamaica. Join our team or get notified when we launch professional cleaning services.',
    testimonials: [],
    faqEntries: [
      {
        question: 'When will VelocityMaid launch in Port Antonio?',
        answer: 'We\'re currently hiring and training our team. Sign up to be notified when we launch!',
      },
      {
        question: 'Are you hiring in Port Antonio?',
        answer: 'Yes! We\'re looking for professional cleaners. Visit our employment page to learn more.',
      },
    ],
  });

  createBranchPayoutRules({
    branchId: branch.id,
    baseRateType: 'PER_JOB',
    baseRateValue: 40,
    overtimeRules: null,
    tipHandling: 'PASS_THROUGH',
    franchiseFeePercentage: null,
  });

  return branch;
}

/**
 * Main seed function
 */
export function seedAllBranches() {
  console.log('🌱 Seeding branches...');
  
  const nj = seedNewJersey();
  console.log(`✅ Seeded New Jersey branch: ${nj.slug} (${nj.id})`);
  
  const vt = seedVermont();
  console.log(`✅ Seeded Vermont branch: ${vt.slug} (${vt.id})`);
  
  const boston = seedBoston();
  console.log(`✅ Seeded Boston branch: ${boston.slug} (${boston.id})`);
  
  const nyc = seedNewYorkCity();
  console.log(`✅ Seeded New York City branch: ${nyc.slug} (${nyc.id})`);
  
  const portAntonio = seedPortAntonio();
  console.log(`✅ Seeded Port Antonio branch: ${portAntonio.slug} (${portAntonio.id})`);
  
  console.log('🎉 All branches seeded successfully!');
  
  return {
    newJersey: nj,
    vermont: vt,
    boston,
    newYorkCity: nyc,
    portAntonio,
  };
}

