/**
 * Weekly Incentive Report Runner
 * 
 * Calculates and saves weekly incentives for all cleaners
 * Should be run weekly (e.g., Sunday night via cron or scheduled job)
 */

import { getCleanerStats } from './cleanerScorecardQueries';
import { getAllCleaners } from './cleanerData';
import { calculateTier, calculateBonus } from './incentiveEngine';
import { createIncentive, getIncentivesByPeriod } from './incentiveData';
import { sendWeeklyIncentiveSummary } from '@/lib/sendWeeklyIncentiveSummary';
import type { ServiceRegion } from './reviewData';

export interface WeeklyIncentiveResult {
  cleanerId: string;
  cleanerName: string;
  region: ServiceRegion;
  incentive: {
    tier: string;
    totalJobs: number;
    bonusAmount: number;
  };
  success: boolean;
  error?: string;
}

export interface WeeklyIncentiveSummary {
  totalProcessed: number;
  totalBonus: number;
  bonusByRegion: {
    new_jersey: number;
    vermont: number;
  };
  topPerformers: Array<{
    cleanerId: string;
    cleanerName: string;
    tier: string;
    bonusAmount: number;
  }>;
  results: WeeklyIncentiveResult[];
}

/**
 * Get date range for last week (Sunday to Saturday)
 */
export function getLastWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const diff = now.getDate() - day - 7; // Go back to last Sunday
  const lastSunday = new Date(now.setDate(diff));
  lastSunday.setHours(0, 0, 0, 0);
  
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  lastSaturday.setHours(23, 59, 59, 999);
  
  return {
    start: lastSunday.toISOString().split('T')[0],
    end: lastSaturday.toISOString().split('T')[0],
  };
}

/**
 * Run weekly incentive report for all cleaners
 */
export async function runWeeklyIncentiveReport(): Promise<WeeklyIncentiveSummary> {
  const { start, end } = getLastWeekRange();
  
  // Check if report already exists for this period
  const existingIncentives = getIncentivesByPeriod(start, end);
  if (existingIncentives.length > 0) {
    console.log(`Weekly incentive report already exists for period ${start} to ${end}`);
    // Could return existing data or skip
  }

  const cleaners = getAllCleaners();
  const results: WeeklyIncentiveResult[] = [];
  let totalBonus = 0;
  const bonusByRegion = {
    new_jersey: 0,
    vermont: 0,
  };
  const topPerformers: Array<{
    cleanerId: string;
    cleanerName: string;
    tier: string;
    bonusAmount: number;
  }> = [];

  // Process each cleaner
  for (const cleaner of cleaners) {
    try {
      // Get cleaner stats (this should filter to last week's jobs)
      const stats = await getCleanerStats(cleaner.id);
      
      if (!stats) {
        results.push({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
          region: cleaner.region,
          incentive: {
            tier: 'Bronze',
            totalJobs: 0,
            bonusAmount: 0,
          },
          success: false,
          error: 'Cleaner stats not found',
        });
        continue;
      }

      // Calculate metrics for last week
      // Note: getCleanerStats returns all-time stats, so we'd need to filter by date
      // For now, using current stats as approximation
      // TODO: Filter stats to last week only
      const metrics = {
        totalJobs: stats.jobsThisWeek, // Use weekly jobs
        avgRating: stats.averageRating,
        onTimeRate: stats.onTimeRate,
        complaintRate: stats.complaintRate || 0,
      };

      // Calculate tier and bonus
      const tier = calculateTier(metrics);
      const bonusAmount = calculateBonus(tier, metrics.totalJobs);

      // Create incentive record
      const incentive = createIncentive({
        cleanerId: cleaner.id,
        periodStart: start,
        periodEnd: end,
        totalJobs: metrics.totalJobs,
        onTimeRate: metrics.onTimeRate,
        completionRate: stats.completionRate,
        avgRating: metrics.avgRating,
        complaintRate: metrics.complaintRate,
        bonusAmount,
        tier,
      });

      // Track totals
      totalBonus += bonusAmount;
      bonusByRegion[cleaner.region] += bonusAmount;

      // Track top performers
      topPerformers.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        tier,
        bonusAmount,
      });

      // Send WhatsApp to cleaner
      try {
        await sendWeeklyIncentiveSummary({
          cleanerId: cleaner.id,
          cleanerName: cleaner.name,
          cleanerPhone: cleaner.phone,
          tier,
          totalJobs: metrics.totalJobs,
          bonusAmount,
        });
      } catch (error) {
        console.error(`Failed to send incentive summary to ${cleaner.name}:`, error);
        // Don't fail the report if message fails
      }

      results.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        region: cleaner.region,
        incentive: {
          tier,
          totalJobs: metrics.totalJobs,
          bonusAmount,
        },
        success: true,
      });
    } catch (error: any) {
      console.error(`Error processing incentive for cleaner ${cleaner.id}:`, error);
      results.push({
        cleanerId: cleaner.id,
        cleanerName: cleaner.name,
        region: cleaner.region,
        incentive: {
          tier: 'Bronze',
          totalJobs: 0,
          bonusAmount: 0,
        },
        success: false,
        error: error.message,
      });
    }
  }

  // Sort top performers by bonus amount
  topPerformers.sort((a, b) => b.bonusAmount - a.bonusAmount);
  const top3 = topPerformers.slice(0, 3);

  // TODO: Send email to admin with summary
  // await sendAdminIncentiveSummaryEmail({
  //   totalProcessed: results.length,
  //   totalBonus,
  //   bonusByRegion,
  //   topPerformers: top3,
  // });

  return {
    totalProcessed: results.length,
    totalBonus,
    bonusByRegion,
    topPerformers: top3,
    results,
  };
}

/**
 * Run weekly incentive report (can be called from API route or cron)
 */
export async function executeWeeklyIncentiveReport(): Promise<WeeklyIncentiveSummary> {
  console.log('Starting weekly incentive report...');
  const summary = await runWeeklyIncentiveReport();
  console.log('Weekly incentive report completed:', {
    totalProcessed: summary.totalProcessed,
    totalBonus: summary.totalBonus,
  });
  return summary;
}



