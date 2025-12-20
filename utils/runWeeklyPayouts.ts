/**
 * Weekly Payout Generator
 * 
 * Generates payouts for all cleaners for the previous week
 * Should be run weekly (e.g., Monday morning via cron or scheduled job)
 */

import { getAllCleaners } from './cleanerData';
import { buildCleanerPayout } from './payoutEngine';
import { createPayout, getPayoutByPeriod } from './payoutData';
import type { ServiceRegion } from './reviewData';

export interface WeeklyPayoutResult {
  cleanerId: string;
  cleanerName: string;
  branch: ServiceRegion;
  payout: {
    totalJobs: number;
    baseEarnings: number;
    bonusEarnings: number;
    netPayout: number;
  };
  success: boolean;
  error?: string;
}

export interface WeeklyPayoutSummary {
  totalProcessed: number;
  totalNetPayouts: number;
  payoutsByRegion: {
    new_jersey: number;
    vermont: number;
  };
  cleanersWithPayouts: number;
  results: WeeklyPayoutResult[];
}

/**
 * Get last week's date range (Monday to Sunday)
 */
export function getLastWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToLastMonday = day === 0 ? 6 : day - 1; // Days to go back to last Monday
  
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday - 7); // Go back to last week's Monday
  lastMonday.setHours(0, 0, 0, 0);
  
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6); // Sunday is 6 days after Monday
  lastSunday.setHours(23, 59, 59, 999);
  
  return {
    start: lastMonday.toISOString().split('T')[0],
    end: lastSunday.toISOString().split('T')[0],
  };
}

/**
 * Run weekly payout generation for all cleaners
 */
export async function runWeeklyPayouts(): Promise<WeeklyPayoutSummary> {
  const { start, end } = getLastWeekRange();
  
  const cleaners = getAllCleaners();
  const results: WeeklyPayoutResult[] = [];
  let totalNetPayouts = 0;
  const payoutsByRegion = {
    new_jersey: 0,
    vermont: 0,
  };
  let cleanersWithPayouts = 0;

  // Process each cleaner
  for (const cleaner of cleaners) {
    try {
      // Check if payout already exists for this period
      const existingPayout = getPayoutByPeriod(cleaner.id, start, end);
      if (existingPayout) {
        console.log(`Payout already exists for ${cleaner.name} (${start} to ${end})`);
        results.push({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
          branch: cleaner.region,
          payout: {
            totalJobs: existingPayout.totalJobs,
            baseEarnings: existingPayout.baseEarnings,
            bonusEarnings: existingPayout.bonusEarnings,
            netPayout: existingPayout.netPayout,
          },
          success: true,
        });
        continue;
      }

      // Build payout calculation
      const payoutCalc = await buildCleanerPayout(
        cleaner.id,
        cleaner.phone,
        cleaner.region,
        start,
        end
      );

      // Only create payout if there are jobs or bonuses
      if (payoutCalc.totalJobs > 0 || payoutCalc.bonusEarnings > 0) {
        // Create payout record
        const payout = createPayout({
          cleanerId: cleaner.id,
          periodStart: start,
          periodEnd: end,
          branch: cleaner.region,
          totalJobs: payoutCalc.totalJobs,
          baseEarnings: payoutCalc.baseEarnings,
          bonusEarnings: payoutCalc.bonusEarnings,
          deductions: payoutCalc.deductions,
          netPayout: payoutCalc.netPayout,
          status: 'pending',
          paymentMethod: null,
          paymentReference: null,
        });

        // Track totals
        totalNetPayouts += payoutCalc.netPayout;
        payoutsByRegion[cleaner.region] += payoutCalc.netPayout;
        cleanersWithPayouts++;

        results.push({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
          branch: cleaner.region,
          payout: {
            totalJobs: payoutCalc.totalJobs,
            baseEarnings: payoutCalc.baseEarnings,
            bonusEarnings: payoutCalc.bonusEarnings,
            netPayout: payoutCalc.netPayout,
          },
          success: true,
        });
      } else {
        results.push({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
          branch: cleaner.region,
          payout: {
            totalJobs: 0,
            baseEarnings: 0,
            bonusEarnings: 0,
            netPayout: 0,
          },
          success: true,
        });
      }
    } catch (error: any) {
      console.error(`Error processing payout for cleaner ${cleaner.id}:`, error);
      results.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        branch: cleaner.region,
        payout: {
          totalJobs: 0,
          baseEarnings: 0,
          bonusEarnings: 0,
          netPayout: 0,
        },
        success: false,
        error: error.message,
      });
    }
  }

  // TODO: Send email to admin with summary
  // await sendAdminPayoutSummaryEmail({
  //   totalProcessed: results.length,
  //   totalNetPayouts,
  //   payoutsByRegion,
  //   cleanersWithPayouts,
  // });

  return {
    totalProcessed: results.length,
    totalNetPayouts,
    payoutsByRegion,
    cleanersWithPayouts,
    results,
  };
}

/**
 * Execute weekly payout generation (can be called from API route or cron)
 */
export async function executeWeeklyPayouts(): Promise<WeeklyPayoutSummary> {
  console.log('Starting weekly payout generation...');
  const summary = await runWeeklyPayouts();
  console.log('Weekly payout generation completed:', {
    totalProcessed: summary.totalProcessed,
    totalNetPayouts: summary.totalNetPayouts,
    cleanersWithPayouts: summary.cleanersWithPayouts,
  });
  return summary;
}




