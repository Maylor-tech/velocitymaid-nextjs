/**
 * Phase L: Pricing Audit & Alerts
 * 
 * Tracks pricing changes and detects anomalies.
 */

import { prisma } from "@/lib/prisma";

export interface PriceChangeEvent {
  jobId: string;
  previousPrice: number;
  newPrice: number;
  changeAmount: number;
  changePercent: number;
  discountAmount: number | null;
  discountReason: string | null;
  adminId: string;
  timestamp: Date;
}

export interface PricingAnomaly {
  type: "high_discount" | "low_margin" | "frequent_changes" | "price_drop";
  severity: "warning" | "critical";
  message: string;
  jobId?: string;
  branchId?: string;
  details: Record<string, any>;
}

/**
 * Get price change events for a time period
 */
export async function getPriceChangeEvents(
  startDate: Date,
  endDate: Date,
  branchId?: string
): Promise<PriceChangeEvent[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: "PRICING_UPDATED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(branchId ? {
        changes: {
          path: ["branchId"],
          equals: branchId,
        },
      } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      entityId: true,
      actorId: true,
      createdAt: true,
      changes: true,
    },
  });

  return logs.map((log) => {
    const changes = log.changes as any;
    const previousPrice = Number(changes.previousPrice || 0);
    const newPrice = Number(changes.newPrice || 0);
    const changeAmount = newPrice - previousPrice;
    const changePercent = previousPrice > 0 
      ? (changeAmount / previousPrice) * 100 
      : 0;

    return {
      jobId: log.entityId,
      previousPrice,
      newPrice,
      changeAmount,
      changePercent,
      discountAmount: changes.discountAmount || null,
      discountReason: changes.discountReason || null,
      adminId: log.actorId,
      timestamp: log.createdAt,
    };
  });
}

/**
 * Detect pricing anomalies
 */
export async function detectPricingAnomalies(
  branchId?: string,
  days: number = 7
): Promise<PricingAnomaly[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await getPriceChangeEvents(startDate, endDate, branchId);
  const anomalies: PricingAnomaly[] = [];

  // Check for high discount frequency
  const discountCount = events.filter((e) => e.discountAmount && e.discountAmount > 0).length;
  if (discountCount > 5) {
    anomalies.push({
      type: "high_discount",
      severity: discountCount > 10 ? "critical" : "warning",
      message: `${discountCount} discounts applied in the last ${days} days`,
      branchId,
      details: { discountCount, days },
    });
  }

  // Check for large price drops
  const largeDrops = events.filter(
    (e) => e.changePercent < -20 && e.changeAmount < -50
  );
  if (largeDrops.length > 0) {
    anomalies.push({
      type: "price_drop",
      severity: "warning",
      message: `${largeDrops.length} significant price drops detected`,
      branchId,
      details: {
        count: largeDrops.length,
        averageDrop: largeDrops.reduce((sum, e) => sum + e.changePercent, 0) / largeDrops.length,
      },
    });
  }

  // Check for frequent changes on same job
  const jobChangeCounts = events.reduce((acc, e) => {
    acc[e.jobId] = (acc[e.jobId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const frequentChanges = Object.entries(jobChangeCounts)
    .filter(([_, count]) => count > 2)
    .map(([jobId, count]) => ({ jobId, count }));

  if (frequentChanges.length > 0) {
    anomalies.push({
      type: "frequent_changes",
      severity: "warning",
      message: `${frequentChanges.length} job(s) with multiple price changes`,
      branchId,
      details: { frequentChanges },
    });
  }

  return anomalies;
}

/**
 * Get discount usage statistics
 */
export async function getDiscountStats(
  startDate: Date,
  endDate: Date,
  branchId?: string
): Promise<{
  totalDiscounts: number;
  totalDiscountAmount: number;
  averageDiscountPercent: number;
  mostCommonReason: string | null;
}> {
  const events = await getPriceChangeEvents(startDate, endDate, branchId);
  const discounts = events.filter((e) => e.discountAmount && e.discountAmount > 0);

  if (discounts.length === 0) {
    return {
      totalDiscounts: 0,
      totalDiscountAmount: 0,
      averageDiscountPercent: 0,
      mostCommonReason: null,
    };
  }

  const totalDiscountAmount = discounts.reduce((sum, e) => sum + (e.discountAmount || 0), 0);
  const averageDiscountPercent = discounts.reduce((sum, e) => sum + Math.abs(e.changePercent), 0) / discounts.length;

  // Find most common reason
  const reasonCounts = discounts.reduce((acc, e) => {
    const reason = e.discountReason || "Unknown";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonReason = Object.entries(reasonCounts)
    .sort(([_, a], [__, b]) => b - a)[0]?.[0] || null;

  return {
    totalDiscounts: discounts.length,
    totalDiscountAmount,
    averageDiscountPercent,
    mostCommonReason,
  };
}










