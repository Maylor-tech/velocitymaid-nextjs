/**
 * Jamaica Finance Queries
 * 
 * Prisma queries for Jamaica branch financial data
 */

import { prisma } from '../lib/prisma';
import { convertUSDToJMD, getCombinedRevenueJMD } from './currencyConverter';

const PORT_ANTONIO_SLUG = 'port-antonio';

/**
 * Get Port Antonio branch ID
 */
async function getPortAntonioBranchId(): Promise<string | null> {
  const branch = await prisma.branch.findUnique({
    where: { slug: PORT_ANTONIO_SLUG },
    select: { id: true },
  });
  return branch?.id || null;
}

/**
 * Get total revenue for Jamaica branch
 */
export async function getJamaicaRevenue(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenueJMD: number;
  totalRevenueUSD: number;
  totalRevenueCombined: number;
  jobCount: number;
}> {
  const branchId = await getPortAntonioBranchId();
  if (!branchId) {
    return {
      totalRevenueJMD: 0,
      totalRevenueUSD: 0,
      totalRevenueCombined: 0,
      jobCount: 0,
    };
  }

  const where: any = {
    branchId,
    status: 'completed',
  };

  if (startDate && endDate) {
    where.completedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const jobs = await prisma.job.findMany({
    where,
    select: {
      totalPrice: true,
      currency: true,
    },
  });

  let totalRevenueJMD = 0;
  let totalRevenueUSD = 0;

  for (const job of jobs) {
    const price = Number(job.totalPrice || 0);
    if (job.currency === 'JMD') {
      totalRevenueJMD += price;
    } else if (job.currency === 'USD') {
      totalRevenueUSD += price;
    }
  }

  const totalRevenueCombined = getCombinedRevenueJMD(totalRevenueJMD, totalRevenueUSD);

  return {
    totalRevenueJMD,
    totalRevenueUSD,
    totalRevenueCombined,
    jobCount: jobs.length,
  };
}

/**
 * Get average ticket size
 */
export async function getAverageTicketSize(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const revenue = await getJamaicaRevenue(startDate, endDate);
  if (revenue.jobCount === 0) {
    return 0;
  }
  return revenue.totalRevenueCombined / revenue.jobCount;
}

/**
 * Get repeat customer rate
 */
export async function getRepeatCustomerRate(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const branchId = await getPortAntonioBranchId();
  if (!branchId) {
    return 0;
  }

  const where: any = {
    branchId,
    status: 'completed',
    customerId: { not: null },
  };

  if (startDate && endDate) {
    where.completedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  // Get all completed jobs with customers
  const jobs = await prisma.job.findMany({
    where,
    select: {
      customerId: true,
    },
  });

  const customerJobCounts = new Map<string, number>();
  for (const job of jobs) {
    if (job.customerId) {
      const count = customerJobCounts.get(job.customerId) || 0;
      customerJobCounts.set(job.customerId, count + 1);
    }
  }

  const totalCustomers = customerJobCounts.size;
  if (totalCustomers === 0) {
    return 0;
  }

  const repeatCustomers = Array.from(customerJobCounts.values()).filter((count) => count > 1)
    .length;

  return (repeatCustomers / totalCustomers) * 100;
}

/**
 * Get service mix distribution
 */
export async function getServiceMixDistribution(
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ serviceType: string; count: number; revenue: number }>> {
  const branchId = await getPortAntonioBranchId();
  if (!branchId) {
    return [];
  }

  const where: any = {
    branchId,
    status: 'completed',
  };

  if (startDate && endDate) {
    where.completedAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const jobs = await prisma.job.findMany({
    where,
    select: {
      serviceType: true,
      totalPrice: true,
      currency: true,
    },
  });

  const serviceMap = new Map<
    string,
    { count: number; revenueJMD: number; revenueUSD: number }
  >();

  for (const job of jobs) {
    const serviceType = job.serviceType || 'Unknown';
    const price = Number(job.totalPrice || 0);

    const existing = serviceMap.get(serviceType) || {
      count: 0,
      revenueJMD: 0,
      revenueUSD: 0,
    };

    existing.count += 1;
    if (job.currency === 'JMD') {
      existing.revenueJMD += price;
    } else if (job.currency === 'USD') {
      existing.revenueUSD += price;
    }

    serviceMap.set(serviceType, existing);
  }

  // Convert to array and calculate combined revenue
  return Array.from(serviceMap.entries()).map(([serviceType, data]) => {
    const revenueCombined = getCombinedRevenueJMD(data.revenueJMD, data.revenueUSD);
    return {
      serviceType,
      count: data.count,
      revenue: revenueCombined,
    };
  });
}

/**
 * Get revenue by week
 */
export async function getRevenueByWeek(weeks: number = 12): Promise<
  Array<{
    week: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }>
> {
  const results: Array<{
    week: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }> = [];

  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const revenue = await getJamaicaRevenue(weekStart, weekEnd);
    const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    results.push({
      week: weekLabel,
      revenueJMD: revenue.totalRevenueJMD,
      revenueUSD: revenue.totalRevenueUSD,
      revenueCombined: revenue.totalRevenueCombined,
      jobCount: revenue.jobCount,
    });
  }

  return results;
}

/**
 * Get revenue by month
 */
export async function getRevenueByMonth(months: number = 12): Promise<
  Array<{
    month: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }>
> {
  const results: Array<{
    month: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }> = [];

  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

    const revenue = await getJamaicaRevenue(monthStart, monthEnd);
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    results.push({
      month: monthLabel,
      revenueJMD: revenue.totalRevenueJMD,
      revenueUSD: revenue.totalRevenueUSD,
      revenueCombined: revenue.totalRevenueCombined,
      jobCount: revenue.jobCount,
    });
  }

  return results;
}


