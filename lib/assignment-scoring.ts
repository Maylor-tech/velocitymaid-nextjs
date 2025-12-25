/**
 * Assignment Engine V3 - Scoring System
 * 
 * Computes assignment score based on:
 * 1. Availability (0-30)
 * 2. Distance (0-20)
 * 3. Cleaner Level (0-20)
 * 4. Performance Score (0-20)
 * 5. Compliance (0-10)
 */

import { calculateCleanerLevel, CleanerLevelMetrics } from './cleaner-level';

export interface AssignmentScore {
  total: number; // 0-100
  breakdown: {
    availability: number; // 0-30
    distance: number; // 0-20
    level: number; // 0-20
    performance: number; // 0-20
    compliance: number; // 0-10
  };
  cleanerId: string;
  cleanerName: string;
}

export interface CleanerForScoring {
  id: string;
  name: string | null;
  availability?: boolean;
  reason?: string;
  timeConflict?: boolean;
  matchScore?: number;
  level?: {
    level: 1 | 2 | 3 | 4;
  };
  trainingStatus?: string | null;
  rating?: number | null;
  completionRate?: number;
  productivityScore?: number;
  preferredCityMatch?: boolean;
  dailyJobs?: number;
  weeklyJobs?: number;
  jqs?: number;
}

export interface JobForScoring {
  id: string;
  preferredDate: Date | null;
  preferredTime: string | null;
  serviceLocation?: string | null;
  address?: string | null;
  branchId: string;
}

/**
 * Calculate distance score (mock function for now)
 * In production, use actual geocoding and distance calculation
 */
function calculateDistanceScore(
  cleaner: CleanerForScoring,
  job: JobForScoring
): number {
  // Mock: If preferred city matches, give full points
  if (cleaner.preferredCityMatch) {
    return 20;
  }

  // Mock: Otherwise, give partial points
  // In production, calculate actual distance and score accordingly
  return 10;
}

/**
 * Calculate availability score
 */
function calculateAvailabilityScore(cleaner: CleanerForScoring): number {
  if (!cleaner.availability) {
    return 0;
  }

  if (cleaner.timeConflict) {
    return 10; // Partial score for time conflict
  }

  return 30; // Full score if available
}

/**
 * Calculate level score
 */
function calculateLevelScore(cleaner: CleanerForScoring): number {
  if (!cleaner.level) {
    return 5; // Default for new cleaners
  }

  switch (cleaner.level.level) {
    case 4:
      return 20; // Elite
    case 3:
      return 15; // Pro
    case 2:
      return 10; // Standard
    default:
      return 5; // New Cleaner
  }
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(cleaner: CleanerForScoring): number {
  let score = 0;

  // Rating component (0-10 points)
  if (cleaner.rating) {
    score += (cleaner.rating / 5) * 10; // Normalize to 0-10
  } else {
    score += 5; // Neutral for unrated cleaners
  }

  // Completion rate component (0-5 points)
  if (cleaner.completionRate !== undefined) {
    score += (cleaner.completionRate / 100) * 5;
  } else {
    score += 2.5; // Neutral
  }

  // Productivity component (0-5 points)
  if (cleaner.productivityScore !== undefined) {
    score += (cleaner.productivityScore / 100) * 5;
  } else {
    score += 2.5; // Neutral
  }

  return Math.min(20, score);
}

/**
 * Calculate compliance score
 */
function calculateComplianceScore(cleaner: CleanerForScoring): number {
  let score = 10; // Start with full score

  // Training status check
  if (cleaner.trainingStatus && cleaner.trainingStatus !== 'PASSED' && cleaner.trainingStatus !== 'ACTIVE') {
    score -= 5; // Penalty for incomplete training
  }

  // Additional compliance checks can be added here
  // e.g., document verification, background check, etc.

  return Math.max(0, score);
}

/**
 * Compute assignment score for a cleaner
 */
export function computeAssignmentScore(
  cleaner: CleanerForScoring,
  job: JobForScoring
): AssignmentScore {
  const availability = calculateAvailabilityScore(cleaner);
  const distance = calculateDistanceScore(cleaner, job);
  const level = calculateLevelScore(cleaner);
  const performance = calculatePerformanceScore(cleaner);
  const compliance = calculateComplianceScore(cleaner);

  const total = availability + distance + level + performance + compliance;

  return {
    total: Math.round(total),
    breakdown: {
      availability,
      distance,
      level,
      performance,
      compliance,
    },
    cleanerId: cleaner.id,
    cleanerName: cleaner.name || 'Unknown',
  };
}

/**
 * Sort cleaners by assignment score (descending)
 */
export function sortCleanersByScore(
  cleaners: CleanerForScoring[],
  job: JobForScoring
): Array<CleanerForScoring & { assignmentScore: AssignmentScore }> {
  return cleaners
    .map((cleaner) => ({
      ...cleaner,
      assignmentScore: computeAssignmentScore(cleaner, job),
    }))
    .sort((a, b) => b.assignmentScore.total - a.assignmentScore.total);
}


















