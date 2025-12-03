/**
 * Branch Data Models and Utilities
 * 
 * Multi-Branch Expansion Engine
 * TODO: Replace with database queries when connecting to real DB
 */

export type BranchStatus = 'ACTIVE' | 'COMING_SOON' | 'PAUSED';
export type BillingType = 'HOURLY' | 'FLAT' | 'TIERED';
export type TipHandling = 'PASS_THROUGH' | 'SPLIT' | 'POOL';
export type BaseRateType = 'PER_HOUR' | 'PER_JOB' | 'PERCENTAGE';
export type SopCategory = 'OPS' | 'SALES' | 'QC' | 'COMPLIANCE';

export interface Branch {
  id: string;
  name: string;
  slug: string; // Unique
  country: string;
  state: string;
  city: string;
  regionLabel: string | null;
  timezone: string;
  primaryPhone: string;
  whatsappNumber: string;
  managerId: string | null;
  pricingModelId: string | null;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchServiceArea {
  id: string;
  branchId: string;
  zipCode: string;
  priority: number;
  city: string | null;
  state: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingModel {
  id: string;
  name: string;
  billingType: BillingType;
  currency: string;
  baseRate: number;
  extraHourRate: number | null;
  minHours: number | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchServicePackage {
  id: string;
  branchId: string;
  code: string; // e.g., "STANDARD_CLEAN"
  name: string;
  description: string | null;
  defaultDurationHours: number;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchConfig {
  id: string;
  branchId: string;
  bookingEmail: string | null;
  supportEmail: string | null;
  maxDailyJobs: number | null;
  whatsappTemplateConfig: Record<string, any> | null;
  zapierHooks: Record<string, any> | null;
  operationsFlags: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAutomationConfig {
  id: string;
  branchId: string;
  bookingWebhookUrl: string | null;
  reminderWebhookUrl: string | null;
  reviewWebhookUrl: string | null;
  whatsappTemplateBooking: string | null;
  whatsappTemplateReminder: string | null;
  whatsappTemplateReview: string | null;
  whatsappTemplateConfig?: any; // JSON field for template packs
  createdAt: string;
  updatedAt: string;
}

export interface BranchLandingContent {
  id: string;
  branchId: string;
  headline: string | null;
  subheadline: string | null;
  heroImageUrl: string | null;
  localCtaLabel: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  testimonials: any[] | null; // JSON array
  faqEntries: any[] | null; // JSON array
  createdAt: string;
  updatedAt: string;
}

export interface BranchPayoutRules {
  id: string;
  branchId: string;
  baseRateType: BaseRateType;
  baseRateValue: number;
  overtimeRules: Record<string, any> | null;
  tipHandling: TipHandling;
  franchiseFeePercentage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchSops {
  id: string;
  branchId: string;
  category: SopCategory;
  title: string;
  docUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchOnboardingResources {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  resourceUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock storage (in-memory)
 * TODO: Replace with database tables
 */
const MOCK_BRANCHES: Branch[] = [];
const MOCK_BRANCH_SERVICE_AREAS: BranchServiceArea[] = [];
const MOCK_PRICING_MODELS: PricingModel[] = [];
const MOCK_BRANCH_SERVICE_PACKAGES: BranchServicePackage[] = [];
const MOCK_BRANCH_CONFIGS: BranchConfig[] = [];
const MOCK_BRANCH_AUTOMATION_CONFIGS: BranchAutomationConfig[] = [];
const MOCK_BRANCH_LANDING_CONTENTS: BranchLandingContent[] = [];
const MOCK_BRANCH_PAYOUT_RULES: BranchPayoutRules[] = [];
const MOCK_BRANCH_SOPS: BranchSops[] = [];
const MOCK_BRANCH_ONBOARDING_RESOURCES: BranchOnboardingResources[] = [];

// Flag to track if branches have been seeded
let branchesSeeded = false;

/**
 * Initialize branches (seeds if empty)
 * This should be called once at app startup
 */
export function initializeBranches() {
  if (!branchesSeeded && MOCK_BRANCHES.length === 0) {
    // Dynamic import to avoid circular dependency
    const { seedAllBranches } = require('./seedBranches');
    seedAllBranches();
    branchesSeeded = true;
  }
}

/**
 * Branch CRUD Operations
 */
export function createBranch(branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Branch {
  const newBranch: Branch = {
    id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...branch,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCHES.push(newBranch);
  return newBranch;
}

export function getBranchById(id: string): Branch | null {
  return MOCK_BRANCHES.find(b => b.id === id) || null;
}

export function getBranchBySlug(slug: string): Branch | null {
  // Auto-initialize if not seeded
  if (!branchesSeeded) {
    initializeBranches();
  }
  return MOCK_BRANCHES.find(b => b.slug === slug) || null;
}

export function getAllBranches(): Branch[] {
  // Auto-initialize if not seeded
  if (!branchesSeeded) {
    initializeBranches();
  }
  return [...MOCK_BRANCHES];
}

export function updateBranch(id: string, updates: Partial<Omit<Branch, 'id' | 'createdAt'>>): Branch | null {
  const branch = getBranchById(id);
  if (!branch) return null;
  
  const updated: Branch = {
    ...branch,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_BRANCHES.findIndex(b => b.id === id);
  if (index !== -1) {
    MOCK_BRANCHES[index] = updated;
  }
  
  return updated;
}

/**
 * Branch Service Area Operations
 */
export function createBranchServiceArea(
  area: Omit<BranchServiceArea, 'id' | 'createdAt' | 'updatedAt'>
): BranchServiceArea {
  const newArea: BranchServiceArea = {
    id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...area,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_SERVICE_AREAS.push(newArea);
  return newArea;
}

export function getServiceAreasByBranchId(branchId: string): BranchServiceArea[] {
  return MOCK_BRANCH_SERVICE_AREAS
    .filter(a => a.branchId === branchId)
    .sort((a, b) => a.priority - b.priority);
}

export function getServiceAreaByZip(zipCode: string): BranchServiceArea | null {
  const normalizedZip = zipCode.trim();
  return MOCK_BRANCH_SERVICE_AREAS
    .filter(a => a.zipCode === normalizedZip)
    .sort((a, b) => {
      // Sort by priority ASC, then by branch creation date
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      const branchA = getBranchById(a.branchId);
      const branchB = getBranchById(b.branchId);
      if (!branchA || !branchB) return 0;
      return new Date(branchA.createdAt).getTime() - new Date(branchB.createdAt).getTime();
    })[0] || null;
}

/**
 * Branch Config Operations
 */
export function createBranchConfig(
  config: Omit<BranchConfig, 'id' | 'createdAt' | 'updatedAt'>
): BranchConfig {
  const newConfig: BranchConfig = {
    id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_CONFIGS.push(newConfig);
  return newConfig;
}

export function getBranchConfig(branchId: string): BranchConfig | null {
  return MOCK_BRANCH_CONFIGS.find(c => c.branchId === branchId) || null;
}

/**
 * Branch Automation Config Operations
 */
export function createBranchAutomationConfig(
  config: Omit<BranchAutomationConfig, 'id' | 'createdAt' | 'updatedAt'>
): BranchAutomationConfig {
  const newConfig: BranchAutomationConfig = {
    id: `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_AUTOMATION_CONFIGS.push(newConfig);
  return newConfig;
}

export function getBranchAutomationConfig(branchId: string): BranchAutomationConfig | null {
  return MOCK_BRANCH_AUTOMATION_CONFIGS.find(c => c.branchId === branchId) || null;
}

export function updateBranchAutomationConfig(
  branchId: string,
  updates: Partial<Omit<BranchAutomationConfig, 'id' | 'branchId' | 'createdAt'>>
): BranchAutomationConfig | null {
  const config = getBranchAutomationConfig(branchId);
  if (!config) return null;
  
  const updated: BranchAutomationConfig = {
    ...config,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_BRANCH_AUTOMATION_CONFIGS.findIndex(c => c.branchId === branchId);
  if (index !== -1) {
    MOCK_BRANCH_AUTOMATION_CONFIGS[index] = updated;
  }
  
  return updated;
}

/**
 * Branch Service Package Operations
 */
export function createBranchServicePackage(
  pkg: Omit<BranchServicePackage, 'id' | 'createdAt' | 'updatedAt'>
): BranchServicePackage {
  const newPkg: BranchServicePackage = {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...pkg,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_SERVICE_PACKAGES.push(newPkg);
  return newPkg;
}

export function getServicePackagesByBranchId(branchId: string): BranchServicePackage[] {
  return MOCK_BRANCH_SERVICE_PACKAGES.filter(p => p.branchId === branchId && p.isActive);
}

/**
 * Pricing Model Operations
 */
export function createPricingModel(
  model: Omit<PricingModel, 'id' | 'createdAt' | 'updatedAt'>
): PricingModel {
  const newModel: PricingModel = {
    id: `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_PRICING_MODELS.push(newModel);
  return newModel;
}

export function getPricingModelById(id: string): PricingModel | null {
  return MOCK_PRICING_MODELS.find(m => m.id === id) || null;
}

export function getAllPricingModels(): PricingModel[] {
  return [...MOCK_PRICING_MODELS];
}

/**
 * Branch Landing Content Operations
 */
export function createBranchLandingContent(
  content: Omit<BranchLandingContent, 'id' | 'createdAt' | 'updatedAt'>
): BranchLandingContent {
  const newContent: BranchLandingContent = {
    id: `landing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_LANDING_CONTENTS.push(newContent);
  return newContent;
}

export function getBranchLandingContent(branchId: string): BranchLandingContent | null {
  return MOCK_BRANCH_LANDING_CONTENTS.find(c => c.branchId === branchId) || null;
}

/**
 * Branch Payout Rules Operations
 */
export function createBranchPayoutRules(
  rules: Omit<BranchPayoutRules, 'id' | 'createdAt' | 'updatedAt'>
): BranchPayoutRules {
  const newRules: BranchPayoutRules = {
    id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...rules,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_PAYOUT_RULES.push(newRules);
  return newRules;
}

export function getBranchPayoutRules(branchId: string): BranchPayoutRules | null {
  return MOCK_BRANCH_PAYOUT_RULES.find(r => r.branchId === branchId) || null;
}

/**
 * Branch SOPs Operations
 */
export function createBranchSop(
  sop: Omit<BranchSops, 'id' | 'createdAt' | 'updatedAt'>
): BranchSops {
  const newSop: BranchSops = {
    id: `sop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...sop,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_SOPS.push(newSop);
  return newSop;
}

export function getBranchSops(branchId: string, category?: SopCategory): BranchSops[] {
  let sops = MOCK_BRANCH_SOPS.filter(s => s.branchId === branchId);
  if (category) {
    sops = sops.filter(s => s.category === category);
  }
  return sops;
}

/**
 * Branch Onboarding Resources Operations
 */
export function createBranchOnboardingResource(
  resource: Omit<BranchOnboardingResources, 'id' | 'createdAt' | 'updatedAt'>
): BranchOnboardingResources {
  const newResource: BranchOnboardingResources = {
    id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...resource,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_BRANCH_ONBOARDING_RESOURCES.push(newResource);
  return newResource;
}

export function getBranchOnboardingResources(branchId: string): BranchOnboardingResources[] {
  return MOCK_BRANCH_ONBOARDING_RESOURCES.filter(r => r.branchId === branchId);
}

/**
 * Database Schema (for future migration)
 * 
 * See prisma/schema.prisma for full Prisma schema
 * 
 * Key tables:
 * - branches
 * - branch_service_areas
 * - pricing_models
 * - branch_service_packages
 * - branch_configs
 * - branch_automation_configs
 * - branch_landing_contents
 * - branch_payout_rules
 * - branch_sops
 * - branch_onboarding_resources
 */

