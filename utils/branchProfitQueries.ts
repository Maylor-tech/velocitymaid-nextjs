/**
 * Branch Profitability Queries
 * 
 * Computes financial and operational metrics by branch (New Jersey vs Vermont)
 * TODO: Replace with database queries when connecting to real DB
 */

import Stripe from 'stripe';

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export type DateRange = 'today' | 'week' | 'month';
export type ServiceRegion = 'new_jersey' | 'vermont';

export interface BranchRevenue {
  jobs: number;
  revenue: number;
}

export interface BranchRevenueData {
  new_jersey: BranchRevenue;
  vermont: BranchRevenue;
}

export interface BranchAverages {
  new_jersey: { avgRevenuePerJob: number };
  vermont: { avgRevenuePerJob: number };
}

export interface BranchTrends {
  dates: string[];
  new_jersey: number[];
  vermont: number[];
}

export interface BranchCosts {
  revenue: number;
  costEstimate: number;
  profit: number;
  margin: number;
}

export interface BranchProfitability {
  new_jersey: BranchCosts;
  vermont: BranchCosts;
}

export interface JobRecord {
  id: string;
  serviceLocation: ServiceRegion;
  serviceType: 'basic' | 'deep' | 'moveInOut';
  totalPrice: number;
  preferredDate: string;
  status: string;
  createdAt?: string;
  completedAt?: string;
  durationMinutes?: number; // Optional, can be estimated
}

/**
 * Get date range boundaries
 */
function getDateRange(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return { start, end };
}

/**
 * Fetch completed jobs from Stripe
 */
async function fetchCompletedJobs(range: DateRange): Promise<JobRecord[]> {
  const stripe = getStripe();
  const { start, end } = getDateRange(range);
  const startTimestamp = Math.floor(start.getTime() / 1000);
  
  const jobs: JobRecord[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      created: { gte: startTimestamp },
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const metadata = session.metadata || {};
      const preferredDate = metadata.preferredDate;
      
      if (!preferredDate) continue;
      
      const jobDate = new Date(preferredDate);
      if (jobDate < start || jobDate > end) continue;
      
      // Only include completed jobs
      if (metadata.completed !== 'true') continue;
      
      const serviceLocation = (metadata.serviceLocation as ServiceRegion) || 'new_jersey';
      const serviceType = metadata.serviceType as 'basic' | 'deep' | 'moveInOut';
      
      if (!serviceType) continue;
      
      // Estimate duration if not available
      // TODO: Get from actual job data when available
      let durationMinutes: number | undefined;
      if (serviceType === 'basic') {
        durationMinutes = 120; // 2 hours
      } else if (serviceType === 'deep') {
        durationMinutes = 240; // 4 hours
      } else if (serviceType === 'moveInOut') {
        durationMinutes = 360; // 6 hours
      }
      
      jobs.push({
        id: session.id,
        serviceLocation,
        serviceType,
        totalPrice: session.amount_total ? session.amount_total / 100 : 0,
        preferredDate,
        status: 'completed',
        createdAt: new Date(session.created * 1000).toISOString(),
        completedAt: metadata.completedAt || new Date(session.created * 1000).toISOString(),
        durationMinutes,
      });
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return jobs;
}

/**
 * Calculate cost estimate for a job based on service type
 */
function calculateJobCost(serviceType: string, totalPrice: number): number {
  switch (serviceType) {
    case 'basic':
      return totalPrice * 0.5; // 50% of revenue
    case 'deep':
      return totalPrice * 0.55; // 55% of revenue
    case 'moveInOut':
      return totalPrice * 0.6; // 60% of revenue
    default:
      return totalPrice * 0.5; // Default 50%
  }
}

/**
 * Get branch revenue for a date range
 */
export async function getBranchRevenue(range: DateRange): Promise<BranchRevenueData> {
  const jobs = await fetchCompletedJobs(range);
  
  const njJobs = jobs.filter(job => job.serviceLocation === 'new_jersey');
  const vtJobs = jobs.filter(job => job.serviceLocation === 'vermont');
  
  return {
    new_jersey: {
      jobs: njJobs.length,
      revenue: njJobs.reduce((sum, job) => sum + job.totalPrice, 0),
    },
    vermont: {
      jobs: vtJobs.length,
      revenue: vtJobs.reduce((sum, job) => sum + job.totalPrice, 0),
    },
  };
}

/**
 * Get branch averages (average revenue per job)
 */
export async function getBranchAverages(range: DateRange): Promise<BranchAverages> {
  const revenue = await getBranchRevenue(range);
  
  return {
    new_jersey: {
      avgRevenuePerJob: revenue.new_jersey.jobs > 0
        ? revenue.new_jersey.revenue / revenue.new_jersey.jobs
        : 0,
    },
    vermont: {
      avgRevenuePerJob: revenue.vermont.jobs > 0
        ? revenue.vermont.revenue / revenue.vermont.jobs
        : 0,
    },
  };
}

/**
 * Get branch revenue trends over time
 */
export async function getBranchTrends(range: DateRange): Promise<BranchTrends> {
  const jobs = await fetchCompletedJobs(range);
  const { start, end } = getDateRange(range);
  
  // Group by date
  const njByDate: Record<string, number> = {};
  const vtByDate: Record<string, number> = {};
  
  jobs.forEach((job) => {
    const dateStr = new Date(job.preferredDate).toISOString().split('T')[0];
    if (job.serviceLocation === 'new_jersey') {
      njByDate[dateStr] = (njByDate[dateStr] || 0) + job.totalPrice;
    } else {
      vtByDate[dateStr] = (vtByDate[dateStr] || 0) + job.totalPrice;
    }
  });
  
  // Generate date array
  const dates: string[] = [];
  const njRevenue: number[] = [];
  const vtRevenue: number[] = [];
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    dates.push(dateStr);
    njRevenue.push(njByDate[dateStr] || 0);
    vtRevenue.push(vtByDate[dateStr] || 0);
    current.setDate(current.getDate() + 1);
  }
  
  return {
    dates,
    new_jersey: njRevenue,
    vermont: vtRevenue,
  };
}

/**
 * Estimate branch costs and calculate profitability
 */
export async function estimateBranchCosts(range: DateRange): Promise<BranchProfitability> {
  const jobs = await fetchCompletedJobs(range);
  
  const njJobs = jobs.filter(job => job.serviceLocation === 'new_jersey');
  const vtJobs = jobs.filter(job => job.serviceLocation === 'vermont');
  
  // Calculate NJ metrics
  const njRevenue = njJobs.reduce((sum, job) => sum + job.totalPrice, 0);
  const njCost = njJobs.reduce((sum, job) => sum + calculateJobCost(job.serviceType, job.totalPrice), 0);
  const njProfit = njRevenue - njCost;
  const njMargin = njRevenue > 0 ? (njProfit / njRevenue) * 100 : 0;
  
  // Calculate VT metrics
  const vtRevenue = vtJobs.reduce((sum, job) => sum + job.totalPrice, 0);
  const vtCost = vtJobs.reduce((sum, job) => sum + calculateJobCost(job.serviceType, job.totalPrice), 0);
  const vtProfit = vtRevenue - vtCost;
  const vtMargin = vtRevenue > 0 ? (vtProfit / vtRevenue) * 100 : 0;
  
  return {
    new_jersey: {
      revenue: njRevenue,
      costEstimate: njCost,
      profit: njProfit,
      margin: njMargin,
    },
    vermont: {
      revenue: vtRevenue,
      costEstimate: vtCost,
      profit: vtProfit,
      margin: vtMargin,
    },
  };
}

