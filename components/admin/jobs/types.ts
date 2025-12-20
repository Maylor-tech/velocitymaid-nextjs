export interface Cleaner {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
  rating?: number | null;
  completedJobs?: number;
  matchScore?: number; // 0–100, from /api/admin/cleaners (legacy)
  isRecommended?: boolean; // computed client-side for top score
  specialties?: string[];
  branchName?: string;
  city?: string | null;
  isActive?: boolean;
  availability?: boolean;
  reason?: string;
  dailyJobs?: number;
  weeklyJobs?: number;
  preferredCityMatch?: boolean;
  trainingStatus?: string | null;
  jqs?: number;
  timeConflict?: boolean;
  // Phase 4 Part B: Assignment Engine V3
  assignmentScore?: {
    total: number;
    breakdown: {
      availability: number;
      distance: number;
      level: number;
      performance: number;
      compliance: number;
    };
  };
  level?: {
    level: 1 | 2 | 3 | 4;
    label: string;
  };
}

export interface Job {
  id: string;
  customerName: string;
  address: string;
  date: string;
  status: string;
  assignedCleanerId?: string | null;
  branchId?: string; // For API calls
}

export interface CleanerProfileDetails {
  cleaner: Cleaner;
  ratingsSummary?: {
    averageRating: number | null;
    totalRatings: number;
    recentRatings: {
      rating: number;
      comment?: string | null;
      customerName?: string | null;
      createdAt: string;
    }[];
  };
  performance?: {
    completionRate: number | null;
    productivityScore: number | null; // 0–100
  };
  payouts?: {
    totalPaid: number;
    recentPayouts: {
      id: string;
      amount: number;
      currency: string;
      period: string;
      status: string;
    }[];
  };
  compliance?: {
    status: 'COMPLIANT' | 'MISSING_TRAINING' | 'MISSING_DOCS';
    issues: string[];
  };
  level?: {
    level: 1 | 2 | 3 | 4;
    label: string;
    description: string;
    requirements: string[];
    benefits: string[];
  };
}

