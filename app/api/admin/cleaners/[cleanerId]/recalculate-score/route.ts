export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCleanerLevel, CleanerLevelMetrics } from '@/lib/cleaner-level';

// POST /api/admin/cleaners/[cleanerId]/recalculate-score
// Recalculate cleaner performance score and level
export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { cleanerId } = params;

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Get all jobs for this cleaner
    const allJobs = await prisma.job.findMany({
      where: { assignedCleanerId: cleanerId },
      orderBy: { createdAt: 'asc' },
    });

    const completedJobs = allJobs.filter((j) => j.status === 'completed');
    const totalJobs = allJobs.length;
    const completedCount = completedJobs.length;

    // Calculate completion rate
    const completionRate = totalJobs > 0 ? (completedCount / totalJobs) * 100 : 0;

    // Get average rating
    const ratings = await prisma.cleanerRating.findMany({
      where: { cleanerId },
    });
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : null;

    // Calculate productivity score (based on weekly jobs)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyJobs = allJobs.filter(
      (j) => j.createdAt >= oneWeekAgo && j.status === 'completed'
    ).length;

    // Productivity score: 0-100 based on weekly jobs (8+ jobs = 100, 0 jobs = 0)
    const productivityScore = Math.min(100, (weeklyJobs / 8) * 100);

    // Get complaints count (assuming complaints are tracked in Job or separate table)
    // For now, we'll use jobs with low JQS as a proxy
    const lowQualityJobs = completedJobs.filter(
      (j) => j.jobQualityScore !== null && j.jobQualityScore < 70
    ).length;
    const complaintsCount = lowQualityJobs; // Simplified - in production, use actual complaints table

    // Calculate days since first job
    const firstJob = allJobs[0];
    const daysSinceFirstJob = firstJob
      ? Math.floor((now.getTime() - firstJob.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Build metrics
    const metrics: CleanerLevelMetrics = {
      daysSinceFirstJob,
      totalJobs,
      completedJobs: completedCount,
      averageRating: avgRating,
      completionRate,
      productivityScore,
      complaintsCount,
    };

    // Calculate level
    const level = calculateCleanerLevel(metrics);

    // Return calculated metrics and level
    return NextResponse.json({
      success: true,
      metrics: {
        daysSinceFirstJob,
        totalJobs,
        completedJobs: completedCount,
        averageRating: avgRating,
        completionRate: Math.round(completionRate * 10) / 10,
        productivityScore: Math.round(productivityScore * 10) / 10,
        complaintsCount,
      },
      level,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Recalculate score error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to recalculate score' },
      { status: 500 }
    );
  }
}

















