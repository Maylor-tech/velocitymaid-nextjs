'use client';

import { useState, useEffect } from 'react';

export interface CleanerScorecardData {
  cleaner: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
    preferredCities: string[];
    primaryBranch: {
      id: string;
      name: string;
      slug: string;
      country: string;
    } | null;
    availability: {
      workingDays: string[];
      timeRanges: Array<{ start: string; end: string }>;
      maxDailyJobs: number;
      blackoutDates: string[];
      isActive: boolean;
    } | null;
    trainingStatus: {
      overallStatus: string;
      lastModuleSlug: string | null;
      updatedAt: string;
    } | null;
  };
  stats: {
    weeklyJobs: number;
    monthlyJobs: number;
    completionRate: number;
    avgJQS: number;
    totalAssigned: number;
    completedCount: number;
  };
  ratings: {
    average: number;
    count: number;
    recent: Array<{
      id: string;
      rating: number;
      comment: string | null;
      customerName: string | null;
      jobId: string;
      createdAt: string;
    }>;
  };
  performance: {
    completionRate: number;
    productivityScore: number;
  };
  payouts: {
    latest: Array<{
      id: string;
      periodStart: string;
      periodEnd: string;
      totalAmount: number;
      currency: string;
      status: string;
      branch: {
        id: string;
        name: string;
        slug: string;
      };
      createdAt: string;
    }>;
    totalPaid: number;
  };
  compliance: {
    status: 'COMPLIANT' | 'MISSING_TRAINING' | 'MISSING_DOCS';
    issues: string[];
  };
  recentJobs: Array<{
    id: string;
    preferredDate: string | null;
    completedAt: string | null;
    customerName: string | null;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    branch: {
      id: string;
      name: string;
      slug: string;
    } | null;
    jobQualityScore: number | null;
    totalPrice: number | null;
    currency: string | null;
  }>;
}

interface UseCleanerScorecardReturn {
  data: CleanerScorecardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCleanerScorecard(cleanerId: string | null): UseCleanerScorecardReturn {
  const [data, setData] = useState<CleanerScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!cleanerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Cleaner not found');
        }
        throw new Error('Failed to load cleaner scorecard');
      }

      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Failed to load cleaner scorecard');
      }
    } catch (err: any) {
      console.error('Error fetching cleaner scorecard:', err);
      setError(err.message || 'Failed to load cleaner scorecard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cleanerId]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}















