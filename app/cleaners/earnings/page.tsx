"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Calendar, TrendingUp, Clock, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/currencyConverter';

interface WeeklyEarning {
  weekStart: Date;
  weekEnd: Date;
  earnings: number;
  bonuses: number;
  jobCount: number;
}

interface EarningsData {
  weeklyEarnings: WeeklyEarning[];
  currentWeek: {
    earnings: number;
    bonuses: number;
    jobCount: number;
    projection: number;
  };
  pendingPayouts: Array<{
    id: string;
    period: string;
    amount: number;
    status: string;
  }>;
  bonusesEarned: {
    thisWeek: {
      jqsBonus: number;
      reviewBonus: number;
      attendanceBonus: number;
      total: number;
    };
    last4Weeks: number[];
  };
  earningsCalendar: {
    last30Days: number;
    jobCount: number;
  };
}

export default function CleanerEarningsPage() {
  const router = useRouter();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cleaners/earnings');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        if (result.error?.includes('Jamaica')) {
          setError('Earnings dashboard is only available for Jamaica branch cleaners.');
        } else {
          setError(result.error || 'Failed to fetch earnings data');
        }
      }
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Failed to load earnings data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-vm-text mb-2">My Earnings</h1>
          <p className="text-vm-muted">Track your earnings, bonuses, and payouts</p>
        </div>

        {/* Current Week Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">This Week's Earnings</h3>
              <DollarSign className="w-5 h-5 text-vm-success" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.currentWeek.earnings, 'JMD')}
            </p>
            <p className="text-sm text-vm-muted mt-1">{data.currentWeek.jobCount} jobs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">This Week's Bonuses</h3>
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.currentWeek.bonuses, 'JMD')}
            </p>
            <div className="text-xs text-vm-muted mt-1 space-y-0.5">
              <div>JQS: {formatCurrency(data.bonusesEarned.thisWeek.jqsBonus, 'JMD')}</div>
              <div>Reviews: {formatCurrency(data.bonusesEarned.thisWeek.reviewBonus, 'JMD')}</div>
              <div>Attendance: {formatCurrency(data.bonusesEarned.thisWeek.attendanceBonus, 'JMD')}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">Week Projection</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.currentWeek.projection, 'JMD')}
            </p>
            <p className="text-sm text-vm-muted mt-1">Earnings + Bonuses</p>
          </div>
        </div>

        {/* Weekly Earnings History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-vm-text mb-4">Last 4 Weeks</h2>
          <div className="space-y-3">
            {data.weeklyEarnings.map((week, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-vm-text">
                    Week of {new Date(week.weekStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-vm-muted">
                    {week.jobCount} jobs • {formatCurrency(week.earnings, 'JMD')} earnings
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-vm-text">
                    {formatCurrency(week.earnings + week.bonuses, 'JMD')}
                  </p>
                  <p className="text-xs text-vm-muted">
                    +{formatCurrency(week.bonuses, 'JMD')} bonuses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payouts */}
        {data.pendingPayouts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-vm-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Pending Payouts
            </h2>
            <div className="space-y-3">
              {data.pendingPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium text-vm-text">{payout.period}</p>
                    <p className="text-sm text-vm-muted">Status: {payout.status}</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(payout.amount, 'JMD')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earnings Calendar Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-vm-text mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Last 30 Days Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-vm-muted">Total Earnings</p>
              <p className="text-2xl font-bold text-vm-text">
                {formatCurrency(data.earningsCalendar.last30Days, 'JMD')}
              </p>
            </div>
            <div>
              <p className="text-sm text-vm-muted">Jobs Completed</p>
              <p className="text-2xl font-bold text-vm-text">
                {data.earningsCalendar.jobCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
