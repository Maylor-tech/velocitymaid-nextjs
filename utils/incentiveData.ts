/**
 * Cleaner Incentive Data Model and Utilities
 * 
 * Tracks cleaner performance and bonuses
 * TODO: Replace with database queries when connecting to real DB
 */

export type IncentiveTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface CleanerIncentive {
  id: string;
  cleanerId: string;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  totalJobs: number;
  onTimeRate: number; // Percentage
  completionRate: number; // Percentage
  avgRating: number; // 1-5
  complaintRate: number; // Percentage
  bonusAmount: number; // Dollars
  tier: IncentiveTier;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock incentives storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_INCENTIVES: CleanerIncentive[] = [];

/**
 * Create a new incentive record
 * TODO: Replace with database INSERT
 */
export function createIncentive(incentive: Omit<CleanerIncentive, 'id' | 'createdAt' | 'updatedAt'>): CleanerIncentive {
  const newIncentive: CleanerIncentive = {
    id: `incentive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...incentive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_INCENTIVES.push(newIncentive);
  return newIncentive;
}

/**
 * Get incentives by cleaner ID
 * TODO: Replace with database SELECT WHERE cleanerId = ?
 */
export function getIncentivesByCleanerId(cleanerId: string): CleanerIncentive[] {
  return MOCK_INCENTIVES
    .filter(i => i.cleanerId === cleanerId)
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
}

/**
 * Get latest incentive for cleaner
 * TODO: Replace with database SELECT WHERE cleanerId = ? ORDER BY periodStart DESC LIMIT 1
 */
export function getLatestIncentive(cleanerId: string): CleanerIncentive | null {
  const incentives = getIncentivesByCleanerId(cleanerId);
  return incentives.length > 0 ? incentives[0] : null;
}

/**
 * Get all incentives
 * TODO: Replace with database SELECT
 */
export function getAllIncentives(periodStart?: string, periodEnd?: string): CleanerIncentive[] {
  let incentives = [...MOCK_INCENTIVES];
  
  if (periodStart) {
    incentives = incentives.filter(i => i.periodStart >= periodStart);
  }
  
  if (periodEnd) {
    incentives = incentives.filter(i => i.periodEnd <= periodEnd);
  }
  
  return incentives.sort(
    (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
  );
}

/**
 * Get incentives by period
 * TODO: Replace with database SELECT WHERE periodStart = ? AND periodEnd = ?
 */
export function getIncentivesByPeriod(periodStart: string, periodEnd: string): CleanerIncentive[] {
  return MOCK_INCENTIVES.filter(
    i => i.periodStart === periodStart && i.periodEnd === periodEnd
  );
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE cleaner_incentives (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   cleaner_id VARCHAR(255) NOT NULL,
 *   period_start DATE NOT NULL,
 *   period_end DATE NOT NULL,
 *   total_jobs INTEGER NOT NULL,
 *   on_time_rate DECIMAL(5,2) NOT NULL,
 *   completion_rate DECIMAL(5,2) NOT NULL,
 *   avg_rating DECIMAL(3,2) NOT NULL,
 *   complaint_rate DECIMAL(5,2) NOT NULL,
 *   bonus_amount DECIMAL(10,2) NOT NULL,
 *   tier VARCHAR(20) NOT NULL 
 *     CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   CONSTRAINT fk_cleaner FOREIGN KEY (cleaner_id) REFERENCES cleaners(id)
 * );
 * 
 * CREATE INDEX idx_incentives_cleaner ON cleaner_incentives(cleaner_id);
 * CREATE INDEX idx_incentives_period ON cleaner_incentives(period_start, period_end);
 * CREATE INDEX idx_incentives_tier ON cleaner_incentives(tier);
 */



