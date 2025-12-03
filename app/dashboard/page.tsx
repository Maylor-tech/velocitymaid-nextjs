'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader';
import RegionTabs from './components/RegionTabs';
import KpiCard from './components/KpiCard';
import JobList from './components/JobList';
import CleanerScheduleCard from './components/CleanerScheduleCard';
import RevenueChart from './components/RevenueChart';
import OperationsAlerts from './components/OperationsAlerts';
import BookingFeed from './components/BookingFeed';
import ReviewsTable from './components/ReviewsTable';
import LeadStats from './components/LeadStats';
import { Job } from './components/JobCard';
import { RevenueData, CleanerSchedule, KPIStats } from '@/utils/dashboardQueries';
import type { Review } from '@/utils/reviewData';

type ServiceRegion = 'new_jersey' | 'vermont' | null;

interface DashboardData {
  jobsToday: Job[];
  jobsNext7Days: Job[];
  revenueData: RevenueData[];
  cleanerSchedules: CleanerSchedule[];
  unassignedJobs: Job[];
  bookingFeed: Job[];
  reminderStatus: Job[];
  jobsMissingConfirmation: Job[];
  jobsWithInvalidPhone: Job[];
  kpiStats: KPIStats;
  reviews: Review[];
  leadStats: {
    leadsThisWeek: number;
    tierA: number;
    tierB: number;
    tierC: number;
    conversionRate: number;
  } | null;
}

export default function DashboardPage() {
  const [selectedRegion, setSelectedRegion] = useState<ServiceRegion>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const regionParam = selectedRegion ? `?region=${selectedRegion}` : '';
      const response = await fetch(`/api/dashboard/data${regionParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    
    return () => clearInterval(interval);
  }, [selectedRegion]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardHeader />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardHeader />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Error loading dashboard</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <DashboardHeader />
      
      <RegionTabs selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          title="Jobs Today"
          value={data.kpiStats.jobsToday}
          icon={<span className="text-2xl">📅</span>}
        />
        <KpiCard
          title="Revenue Today"
          value={`$${data.kpiStats.revenueToday.toFixed(0)}`}
          icon={<span className="text-2xl">💰</span>}
        />
        <KpiCard
          title="Completion Rate"
          value={`${data.kpiStats.completionRate.toFixed(1)}%`}
          subtitle={`${Math.round((data.kpiStats.completionRate / 100) * data.jobsNext7Days.length)} of ${data.jobsNext7Days.length} jobs`}
          icon={<span className="text-2xl">✓</span>}
        />
        <KpiCard
          title="Active Cleaners"
          value={data.kpiStats.cleanersActiveToday}
          icon={<span className="text-2xl">👷</span>}
        />
        <KpiCard
          title="Pending Approval"
          value={data.kpiStats.pendingApproval}
          icon={<span className="text-2xl">⏳</span>}
        />
        <KpiCard
          title="Missing Assignment"
          value={data.kpiStats.jobsMissingAssignment}
          icon={<span className="text-2xl">⚠️</span>}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Job Timeline */}
        <div className="lg:col-span-2">
          <JobList
            jobs={data.jobsNext7Days}
            title="Upcoming Jobs (Next 7 Days)"
            emptyMessage="No upcoming jobs"
          />
        </div>

        {/* Right Column - Alerts & Feed */}
        <div className="space-y-6">
          <OperationsAlerts
            jobsNeedingReminders={data.reminderStatus}
            jobsMissingConfirmation={data.jobsMissingConfirmation}
            jobsWithInvalidPhone={data.jobsWithInvalidPhone}
            unassignedJobs={data.unassignedJobs}
          />
          <BookingFeed bookings={data.bookingFeed} />
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart data={data.revenueData} region={selectedRegion} />
      </div>

      {/* Cleaner Schedules */}
      {data.cleanerSchedules.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cleaner Schedules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.cleanerSchedules.map((schedule, index) => (
                <CleanerScheduleCard
                  key={schedule.cleanerPhone}
                  schedule={schedule}
                  region={data.jobsNext7Days.find(j => j.assignedCleanerPhone === schedule.cleanerPhone)?.serviceLocation || 'new_jersey'}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Stats */}
      {data.leadStats && (
        <div className="mb-6">
          <LeadStats stats={data.leadStats} />
        </div>
      )}

      {/* Customer Reviews */}
      <div className="mb-6">
        <ReviewsTable reviews={data.reviews} region={selectedRegion} />
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

