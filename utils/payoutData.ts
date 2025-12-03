/**
 * Cleaner Payout Data Model and Utilities
 * 
 * Tracks cleaner payouts and earnings
 * TODO: Replace with database queries when connecting to real DB
 */

export type ServiceRegion = 'new_jersey' | 'vermont';
export type PayoutStatus = 'pending' | 'approved' | 'paid';
export type PaymentMethod = 'manual' | 'stripe' | 'bank_transfer' | 'cash';

export interface CleanerPayout {
  id: string;
  cleanerId: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  branch: ServiceRegion;
  totalJobs: number;
  baseEarnings: number; // Dollars
  bonusEarnings: number; // Dollars
  deductions: number; // Dollars
  netPayout: number; // Dollars
  status: PayoutStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

/**
 * Mock payouts storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_PAYOUTS: CleanerPayout[] = [];

/**
 * Create a new payout record
 * TODO: Replace with database INSERT
 */
export function createPayout(payout: Omit<CleanerPayout, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'>): CleanerPayout {
  const newPayout: CleanerPayout = {
    id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...payout,
    paidAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_PAYOUTS.push(newPayout);
  return newPayout;
}

/**
 * Get payout by ID
 * TODO: Replace with database SELECT WHERE id = ?
 */
export function getPayoutById(id: string): CleanerPayout | null {
  return MOCK_PAYOUTS.find(p => p.id === id) || null;
}

/**
 * Get payouts by cleaner ID
 * TODO: Replace with database SELECT WHERE cleanerId = ?
 */
export function getPayoutsByCleanerId(cleanerId: string): CleanerPayout[] {
  return MOCK_PAYOUTS
    .filter(p => p.cleanerId === cleanerId)
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
}

/**
 * Get latest payout for cleaner
 * TODO: Replace with database SELECT WHERE cleanerId = ? ORDER BY periodStart DESC LIMIT 1
 */
export function getLatestPayout(cleanerId: string): CleanerPayout | null {
  const payouts = getPayoutsByCleanerId(cleanerId);
  return payouts.length > 0 ? payouts[0] : null;
}

/**
 * Get all payouts with optional filters
 * TODO: Replace with database SELECT WHERE
 */
export function getAllPayouts(filters?: {
  periodStart?: string;
  periodEnd?: string;
  status?: PayoutStatus;
  branch?: ServiceRegion;
}): CleanerPayout[] {
  let payouts = [...MOCK_PAYOUTS];
  
  if (filters?.periodStart) {
    payouts = payouts.filter(p => p.periodStart >= filters.periodStart!);
  }
  
  if (filters?.periodEnd) {
    payouts = payouts.filter(p => p.periodEnd <= filters.periodEnd!);
  }
  
  if (filters?.status) {
    payouts = payouts.filter(p => p.status === filters.status);
  }
  
  if (filters?.branch) {
    payouts = payouts.filter(p => p.branch === filters.branch);
  }
  
  return payouts.sort(
    (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
  );
}

/**
 * Get payout by period
 * TODO: Replace with database SELECT WHERE cleanerId = ? AND periodStart = ? AND periodEnd = ?
 */
export function getPayoutByPeriod(cleanerId: string, periodStart: string, periodEnd: string): CleanerPayout | null {
  return MOCK_PAYOUTS.find(
    p => p.cleanerId === cleanerId && p.periodStart === periodStart && p.periodEnd === periodEnd
  ) || null;
}

/**
 * Update payout
 * TODO: Replace with database UPDATE
 */
export function updatePayout(
  id: string,
  updates: {
    status?: PayoutStatus;
    deductions?: number;
    paymentMethod?: PaymentMethod | null;
    paymentReference?: string | null;
  }
): CleanerPayout | null {
  const payout = getPayoutById(id);
  if (!payout) {
    return null;
  }
  
  // Recalculate netPayout if deductions change
  const newDeductions = updates.deductions !== undefined ? updates.deductions : payout.deductions;
  const newNetPayout = payout.baseEarnings + payout.bonusEarnings - newDeductions;
  
  const updatedPayout: CleanerPayout = {
    ...payout,
    ...updates,
    netPayout: newNetPayout,
    updatedAt: new Date().toISOString(),
    paidAt: 
      (updates.status === 'paid' && payout.status !== 'paid')
        ? new Date().toISOString()
        : payout.paidAt,
  };
  
  const index = MOCK_PAYOUTS.findIndex(p => p.id === id);
  if (index !== -1) {
    MOCK_PAYOUTS[index] = updatedPayout;
  }
  
  return updatedPayout;
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE cleaner_payouts (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   cleaner_id VARCHAR(255) NOT NULL,
 *   period_start DATE NOT NULL,
 *   period_end DATE NOT NULL,
 *   branch VARCHAR(20) NOT NULL 
 *     CHECK (branch IN ('new_jersey', 'vermont')),
 *   total_jobs INTEGER NOT NULL,
 *   base_earnings DECIMAL(10,2) NOT NULL,
 *   bonus_earnings DECIMAL(10,2) NOT NULL,
 *   deductions DECIMAL(10,2) DEFAULT 0,
 *   net_payout DECIMAL(10,2) NOT NULL,
 *   status VARCHAR(20) NOT NULL 
 *     CHECK (status IN ('pending', 'approved', 'paid')),
 *   payment_method VARCHAR(20) 
 *     CHECK (payment_method IN ('manual', 'stripe', 'bank_transfer', 'cash')),
 *   payment_reference VARCHAR(255),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   paid_at TIMESTAMP,
 *   CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
 * );
 * 
 * CREATE INDEX idx_payouts_cleaner ON cleaner_payouts(cleaner_id);
 * CREATE INDEX idx_payouts_period ON cleaner_payouts(period_start, period_end);
 * CREATE INDEX idx_payouts_status ON cleaner_payouts(status);
 * CREATE INDEX idx_payouts_branch ON cleaner_payouts(branch);
 */



