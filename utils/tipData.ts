/**
 * Tip Data Model
 * 
 * TODO: Replace with database queries when connecting to real DB
 */

export type TipStatus = 'pending' | 'paid' | 'failed';

export interface Tip {
  id: string;
  jobId: string;
  cleanerId: string;
  customerId: string;
  tipAmount: number; // Dollars
  stripePaymentIntentId: string | null;
  status: TipStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

/**
 * Mock tips storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_TIPS: Tip[] = [];

/**
 * Create tip record
 * TODO: Replace with database INSERT
 */
export function createTip(tip: Omit<Tip, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'>): Tip {
  const newTip: Tip = {
    id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...tip,
    paidAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_TIPS.push(newTip);
  return newTip;
}

/**
 * Get tips by customer ID
 * TODO: Replace with database SELECT WHERE customerId = ?
 */
export function getTipsByCustomerId(customerId: string): Tip[] {
  return MOCK_TIPS
    .filter(t => t.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get tip by job ID
 * TODO: Replace with database SELECT WHERE jobId = ?
 */
export function getTipByJobId(jobId: string): Tip | null {
  return MOCK_TIPS.find(t => t.jobId === jobId) || null;
}

/**
 * Update tip status
 * TODO: Replace with database UPDATE
 */
export function updateTipStatus(
  id: string,
  status: TipStatus,
  stripePaymentIntentId?: string
): Tip | null {
  const tip = MOCK_TIPS.find(t => t.id === id);
  if (!tip) {
    return null;
  }
  
  const updated: Tip = {
    ...tip,
    status,
    stripePaymentIntentId: stripePaymentIntentId || tip.stripePaymentIntentId,
    paidAt: status === 'paid' ? new Date().toISOString() : tip.paidAt,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_TIPS.findIndex(t => t.id === id);
  if (index !== -1) {
    MOCK_TIPS[index] = updated;
  }
  
  return updated;
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE tips (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   job_id VARCHAR(255) NOT NULL,
 *   cleaner_id VARCHAR(255) NOT NULL,
 *   customer_id UUID NOT NULL,
 *   tip_amount DECIMAL(10,2) NOT NULL,
 *   stripe_payment_intent_id VARCHAR(255),
 *   status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   paid_at TIMESTAMP,
 *   CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
 * );
 * 
 * CREATE INDEX idx_tips_customer ON tips(customer_id);
 * CREATE INDEX idx_tips_job ON tips(job_id);
 * CREATE INDEX idx_tips_cleaner ON tips(cleaner_id);
 */



