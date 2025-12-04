"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, PlayCircle, Filter, Eye, Award } from 'lucide-react';
import Link from 'next/link';

interface CleanerTrainingStatus {
  cleanerId: string;
  cleanerName: string;
  cleanerEmail: string;
  branchName: string;
  branchCountry: string;
  overallStatus: string;
  lastModuleSlug: string | null;
  updatedAt: string;
  completedLessons: number;
  totalLessons: number;
}

export default function AdminTrainingPage() {
  const router = useRouter();
  const [cleaners, setCleaners] = useState<CleanerTrainingStatus[]>([]);
  const [filteredCleaners, setFilteredCleaners] = useState<CleanerTrainingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTrainingStatus();
  }, []);

  useEffect(() => {
    filterCleaners();
  }, [cleaners, statusFilter]);

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/admin/cleaners/training');
      const result = await response.json();

      if (result.success) {
        setCleaners(result.cleaners);
      } else {
        setError(result.error || 'Failed to load training status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterCleaners = () => {
    if (statusFilter === 'all') {
      setFilteredCleaners(cleaners);
    } else {
      setFilteredCleaners(
        cleaners.filter((c) => c.overallStatus.toLowerCase() === statusFilter.toLowerCase())
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Passed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            Not Started
          </span>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Training Management</h1>
            <Link
              href="/admin/cleaners/applications"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Applications
            </Link>
          </div>
          <p className="text-gray-600">Monitor and manage training progress for Jamaica branch cleaners</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="passed">Passed</option>
          </select>
          <span className="text-sm text-gray-600">
            Showing {filteredCleaners.length} of {cleaners.length} cleaners
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCleaners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No cleaners found
                    </td>
                  </tr>
                ) : (
                  filteredCleaners.map((cleaner) => (
                    <tr key={cleaner.cleanerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {cleaner.overallStatus === 'PASSED' && (
                            <Award className="w-4 h-4 text-yellow-500" aria-label="Jamaica Certified" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cleaner.cleanerName}</div>
                            <div className="text-sm text-gray-500">{cleaner.cleanerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cleaner.branchName}</div>
                        <div className="text-sm text-gray-500">{cleaner.branchCountry}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(cleaner.overallStatus)}
                          {getStatusBadge(cleaner.overallStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cleaner.completedLessons} / {cleaner.totalLessons} lessons
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${getPercentage(cleaner.completedLessons, cleaner.totalLessons)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getPercentage(cleaner.completedLessons, cleaner.totalLessons)}% complete
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cleaner.lastModuleSlug || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(cleaner.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/training/${cleaner.cleanerId}`}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

