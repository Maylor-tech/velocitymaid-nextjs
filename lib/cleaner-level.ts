/**
 * Cleaner Level Calculation System
 * 
 * Calculates cleaner level based on performance metrics:
 * - Level 1 (New Cleaner): < 2 weeks, < 5 jobs
 * - Level 2 (Standard): Rating ≥ 4.0, Completion ≥ 85%
 * - Level 3 (Pro): Rating ≥ 4.5, Completion ≥ 90%, Productivity ≥ 70
 * - Level 4 (Elite): Rating ≥ 4.8, Complaints = 0
 */

export interface CleanerLevelMetrics {
  daysSinceFirstJob: number;
  totalJobs: number;
  completedJobs: number;
  averageRating: number | null;
  completionRate: number; // 0-100
  productivityScore: number; // 0-100
  complaintsCount: number;
}

export interface CleanerLevel {
  level: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

export function calculateCleanerLevel(metrics: CleanerLevelMetrics): CleanerLevel {
  const {
    daysSinceFirstJob,
    totalJobs,
    completedJobs,
    averageRating,
    completionRate,
    productivityScore,
    complaintsCount,
  } = metrics;

  // Level 1: New Cleaner
  if (daysSinceFirstJob < 14 || totalJobs < 5) {
    return {
      level: 1,
      label: 'New Cleaner',
      description: 'Recently joined, building experience',
      requirements: ['< 2 weeks active', '< 5 jobs completed'],
      benefits: ['Standard job assignments', 'Basic support'],
    };
  }

  // Level 4: Elite (highest requirements)
  if (
    averageRating !== null &&
    averageRating >= 4.8 &&
    completionRate >= 90 &&
    productivityScore >= 80 &&
    complaintsCount === 0 &&
    totalJobs >= 50
  ) {
    return {
      level: 4,
      label: 'Elite',
      description: 'Top performer with exceptional ratings and zero complaints',
      requirements: [
        'Rating ≥ 4.8',
        'Completion ≥ 90%',
        'Productivity ≥ 80',
        'Zero complaints',
        '50+ jobs',
      ],
      benefits: [
        'Priority job assignments',
        'High-value job eligibility',
        'Premium bonus rates',
        'Fast payout processing',
      ],
    };
  }

  // Level 3: Pro
  if (
    averageRating !== null &&
    averageRating >= 4.5 &&
    completionRate >= 90 &&
    productivityScore >= 70 &&
    totalJobs >= 20
  ) {
    return {
      level: 3,
      label: 'Pro',
      description: 'Experienced cleaner with strong performance',
      requirements: [
        'Rating ≥ 4.5',
        'Completion ≥ 90%',
        'Productivity ≥ 70',
        '20+ jobs',
      ],
      benefits: [
        'Priority assignments',
        'High-value job access',
        'Enhanced bonus rates',
      ],
    };
  }

  // Level 2: Standard (default for experienced cleaners)
  if (
    averageRating !== null &&
    averageRating >= 4.0 &&
    completionRate >= 85
  ) {
    return {
      level: 2,
      label: 'Standard',
      description: 'Reliable cleaner meeting performance standards',
      requirements: ['Rating ≥ 4.0', 'Completion ≥ 85%'],
      benefits: ['Standard job assignments', 'Regular bonus eligibility'],
    };
  }

  // Fallback to Level 1 if metrics don't meet Level 2 requirements
  return {
    level: 1,
    label: 'New Cleaner',
    description: 'Building experience and performance',
    requirements: ['Building experience'],
    benefits: ['Standard job assignments', 'Basic support'],
  };
}

/**
 * Get level badge color
 */
export function getLevelBadgeColor(level: number): string {
  switch (level) {
    case 4:
      return 'bg-purple-100 text-purple-800';
    case 3:
      return 'bg-vm-cyan-tint text-blue-800';
    case 2:
      return 'bg-vm-success-bg text-green-800';
    default:
      return 'bg-gray-100 text-vm-text';
  }
}

/**
 * Check if cleaner is eligible for high-value jobs
 */
export function isEligibleForHighValueJobs(level: CleanerLevel): boolean {
  return level.level >= 3;
}

/**
 * Get bonus multiplier based on level
 */
export function getBonusMultiplier(level: number): number {
  switch (level) {
    case 4:
      return 1.5; // 50% bonus
    case 3:
      return 1.3; // 30% bonus
    case 2:
      return 1.1; // 10% bonus
    default:
      return 1.0; // No bonus
  }
}


















