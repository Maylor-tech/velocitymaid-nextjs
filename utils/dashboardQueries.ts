/**
 * Dashboard Data Queries
 * 
 * Fetches operational data from Stripe checkout sessions for the dashboard
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

export type ServiceRegion = 'new_jersey' | 'vermont' | null;

export interface DashboardJob {
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  serviceLocation: string;
  totalPrice: number;
  status: 'scheduled' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
  assignedCleanerPhone?: string;
  assignedCleanerName?: string;
  confirmationSent?: boolean;
  reminderSent?: boolean;
  createdAt: string;
}

export interface CleanerSchedule {
  cleanerPhone: string;
  cleanerName?: string;
  jobs: DashboardJob[];
  gaps: Array<{ start: string; end: string }>;
  overlaps: Array<{ job1: DashboardJob; job2: DashboardJob }>;
}

export interface RevenueData {
  date: string;
  newJersey: number;
  vermont: number;
  total: number;
}

export interface KPIStats {
  jobsToday: number;
  revenueToday: number;
  completionRate: number;
  cleanersActiveToday: number;
  pendingApproval: number;
  jobsMissingAssignment: number;
}

/**
 * Filter jobs by region
 */
function filterByRegion(jobs: DashboardJob[], region: ServiceRegion): DashboardJob[] {
  if (!region) return jobs;
  return jobs.filter(job => job.serviceLocation === region);
}

/**
 * Convert Stripe session to DashboardJob
 */
function sessionToJob(session: Stripe.Checkout.Session): DashboardJob | null {
  const metadata = session.metadata || {};
  const firstName = metadata.firstName || '';
  const lastInitial = metadata.lastInitial || '';
  const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

  if (!customerName || !metadata.preferredDate) {
    return null;
  }

  // Determine status
  let status: DashboardJob['status'] = 'scheduled';
  if (session.status === 'complete') {
    status = 'confirmed';
  }
  if (metadata.assignedCleanerPhone) {
    status = 'assigned';
  }
  if (metadata.completed === 'true') {
    status = 'completed';
  }
  if (metadata.cancelled === 'true') {
    status = 'cancelled';
  }

  return {
    sessionId: session.id,
    customerName,
    phone: metadata.phone || '',
    email: metadata.email || session.customer_email || '',
    serviceType: metadata.serviceType || '',
    preferredDate: metadata.preferredDate || '',
    preferredTime: metadata.preferredTime || 'Morning',
    address: metadata.address || '',
    serviceLocation: metadata.serviceLocation || 'new_jersey',
    totalPrice: session.amount_total ? session.amount_total / 100 : 0,
    status,
    assignedCleanerPhone: metadata.assignedCleanerPhone,
    assignedCleanerName: metadata.assignedCleanerName,
    confirmationSent: metadata.whatsappConfirmationSent === 'true',
    reminderSent: metadata.reminder24hSent === 'true',
    createdAt: new Date(session.created * 1000).toISOString(),
  };
}

/**
 * Get jobs for today
 */
export async function getJobsToday(region?: ServiceRegion): Promise<DashboardJob[]> {
  const stripe = getStripe();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const jobs: DashboardJob[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const job = sessionToJob(session);
      if (job && job.preferredDate === todayStr) {
        jobs.push(job);
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return filterByRegion(jobs, region || null);
}

/**
 * Get jobs for next 7 days
 */
export async function getJobsNext7Days(region?: ServiceRegion): Promise<DashboardJob[]> {
  const stripe = getStripe();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const todayStr = today.toISOString().split('T')[0];
  const endStr = sevenDaysLater.toISOString().split('T')[0];

  const jobs: DashboardJob[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const job = sessionToJob(session);
      if (job && job.preferredDate >= todayStr && job.preferredDate <= endStr) {
        jobs.push(job);
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Sort by date and time
  jobs.sort((a, b) => {
    const dateCompare = a.preferredDate.localeCompare(b.preferredDate);
    if (dateCompare !== 0) return dateCompare;
    return a.preferredTime.localeCompare(b.preferredTime);
  });

  return filterByRegion(jobs, region || null);
}

/**
 * Get revenue for last 7 days
 */
export async function getRevenueLast7Days(region?: ServiceRegion): Promise<RevenueData[]> {
  const stripe = getStripe();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const revenueMap: Record<string, { newJersey: number; vermont: number }> = {};

  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    revenueMap[dateStr] = { newJersey: 0, vermont: 0 };
  }

  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      created: { gte: Math.floor(sevenDaysAgo.getTime() / 1000) },
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const job = sessionToJob(session);
      if (!job) continue;

      const createdDate = new Date(session.created * 1000);
      const dateStr = createdDate.toISOString().split('T')[0];

      if (revenueMap[dateStr]) {
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        if (job.serviceLocation === 'new_jersey') {
          revenueMap[dateStr].newJersey += amount;
        } else if (job.serviceLocation === 'vermont') {
          revenueMap[dateStr].vermont += amount;
        }
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  const result: RevenueData[] = Object.entries(revenueMap)
    .map(([date, data]) => ({
      date,
      newJersey: region === 'vermont' ? 0 : data.newJersey,
      vermont: region === 'new_jersey' ? 0 : data.vermont,
      total: data.newJersey + data.vermont,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

/**
 * Get cleaner schedules
 */
export async function getCleanerSchedules(region?: ServiceRegion): Promise<CleanerSchedule[]> {
  const jobs = await getJobsNext7Days(region);
  const assignedJobs = jobs.filter(job => job.assignedCleanerPhone && job.status !== 'cancelled');

  // Group by cleaner
  const cleanerMap: Record<string, CleanerSchedule> = {};

  for (const job of assignedJobs) {
    const cleanerPhone = job.assignedCleanerPhone!;
    if (!cleanerMap[cleanerPhone]) {
      cleanerMap[cleanerPhone] = {
        cleanerPhone,
        cleanerName: job.assignedCleanerName,
        jobs: [],
        gaps: [],
        overlaps: [],
      };
    }
    cleanerMap[cleanerPhone].jobs.push(job);
  }

  // Sort jobs by date/time for each cleaner
  for (const schedule of Object.values(cleanerMap)) {
    schedule.jobs.sort((a, b) => {
      const dateCompare = a.preferredDate.localeCompare(b.preferredDate);
      if (dateCompare !== 0) return dateCompare;
      return a.preferredTime.localeCompare(b.preferredTime);
    });

    // Detect overlaps (simplified - checks same date)
    for (let i = 0; i < schedule.jobs.length - 1; i++) {
      const job1 = schedule.jobs[i];
      const job2 = schedule.jobs[i + 1];
      if (job1.preferredDate === job2.preferredDate) {
        schedule.overlaps.push({ job1, job2 });
      }
    }
  }

  return Object.values(cleanerMap);
}

/**
 * Get unassigned jobs
 */
export async function getUnassignedJobs(region?: ServiceRegion): Promise<DashboardJob[]> {
  const jobs = await getJobsNext7Days(region);
  return jobs.filter(
    job => !job.assignedCleanerPhone && job.status !== 'cancelled' && job.status !== 'completed'
  );
}

/**
 * Get booking feed (last 24 hours)
 */
export async function getBookingFeed(region?: ServiceRegion): Promise<DashboardJob[]> {
  const stripe = getStripe();
  const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  const jobs: DashboardJob[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      created: { gte: oneDayAgo },
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const job = sessionToJob(session);
      if (job) {
        jobs.push(job);
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Sort by creation date (newest first)
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return filterByRegion(jobs, region || null);
}

/**
 * Get reminder status (jobs needing reminders)
 */
export async function getReminderStatus(region?: ServiceRegion): Promise<DashboardJob[]> {
  const jobs = await getJobsNext7Days(region);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return jobs.filter(job => {
    if (job.reminderSent) return false;
    if (job.status === 'cancelled' || job.status === 'completed') return false;

    const jobDate = new Date(job.preferredDate);
    const hoursUntilJob = (jobDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Jobs within 24 hours that haven't received reminder
    return hoursUntilJob <= 24 && hoursUntilJob > 0;
  });
}

/**
 * Get completion stats
 */
export async function getCompletionStats(region?: ServiceRegion): Promise<{
  total: number;
  completed: number;
  rate: number;
}> {
  const jobs = await getJobsNext7Days(region);
  const pastJobs = jobs.filter(job => {
    const jobDate = new Date(job.preferredDate);
    return jobDate < new Date();
  });

  const completed = pastJobs.filter(job => job.status === 'completed').length;
  const total = pastJobs.length;

  return {
    total,
    completed,
    rate: total > 0 ? (completed / total) * 100 : 0,
  };
}

/**
 * Get KPI stats
 */
export async function getKPIStats(region?: ServiceRegion): Promise<KPIStats> {
  const jobsToday = await getJobsToday(region);
  const unassigned = await getUnassignedJobs(region);
  const completionStats = await getCompletionStats(region);

  // Calculate revenue today
  const revenueToday = jobsToday.reduce((sum, job) => sum + job.totalPrice, 0);

  // Get unique cleaners active today
  const cleanersActiveToday = new Set(
    jobsToday
      .filter(job => job.assignedCleanerPhone)
      .map(job => job.assignedCleanerPhone!)
  ).size;

  return {
    jobsToday: jobsToday.length,
    revenueToday,
    completionRate: completionStats.rate,
    cleanersActiveToday,
    pendingApproval: 0, // Placeholder - would need approval tracking
    jobsMissingAssignment: unassigned.length,
  };
}




