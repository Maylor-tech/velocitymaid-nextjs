'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, PlayCircle, Award, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface LessonProgress {
  id: string;
  title: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  moduleTitle: string;
  moduleSlug: string;
}

interface CleanerTrainingDetail {
  cleanerId: string;
  cleanerName: string;
  cleanerEmail: string;
  branchName: string;
  overallStatus: string;
  completedLessons: number;
  totalLessons: number;
  lessons: LessonProgress[];
}

export default function CleanerTrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cleanerId = params.cleanerId as string;

  const [data, setData] = useState<CleanerTrainingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (cleanerId) {
      fetchTrainingDetail();
    }
  }, [cleanerId]);

  const fetchTrainingDetail = async () => {
    try {
      const response = await fetch(`/api/admin/training/${cleanerId}`);
      const result = await response.json();

      if (result.success) {
        setData(result.detail);
      } else {
        setError(result.error || 'Failed to load training details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideToPassed = async () => {
    if (!confirm('Mark this cleaner\'s training as PASSED? This will allow them to receive job assignments.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/training/${cleanerId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PASSED' }),
      });

      const result = await response.json();
      if (result.success) {
        fetchTrainingDetail(); // Refresh
      } else {
        alert(result.error || 'Failed to update training status');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTraining = async () => {
    if (!confirm('Reset this cleaner\'s training? This will clear all progress and require them to start over.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/training/${cleanerId}/reset`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        fetchTrainingDetail(); // Refresh
      } else {
        alert(result.error || 'Failed to reset training');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
            Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Training details not found'}</p>
          <Link
            href="/admin/training"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Training
          </Link>
        </div>
      </div>
    );
  }

  const percentage = data.totalLessons > 0
    ? Math.round((data.completedLessons / data.totalLessons) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/training"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Training Management
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {data.cleanerName}
                {data.overallStatus === 'PASSED' && (
                  <Award className="w-6 h-6 text-yellow-500 inline-block ml-2" title="Jamaica Certified" />
                )}
              </h1>
              <p className="text-gray-600">{data.cleanerEmail}</p>
              <p className="text-sm text-gray-500 mt-1">{data.branchName}</p>
            </div>
            <div className="flex gap-3">
              {data.overallStatus !== 'PASSED' && (
                <button
                  onClick={handleOverrideToPassed}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Passed
                </button>
              )}
              <button
                onClick={handleResetTraining}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Training
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Status</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {data.overallStatus.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.completedLessons} / {data.totalLessons}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion</p>
              <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Lessons by Module */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lessons Progress</h2>
          <div className="space-y-4">
            {data.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(lesson.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                      {getStatusBadge(lesson.status)}
                    </div>
                    <p className="text-sm text-gray-600">{lesson.moduleTitle}</p>
                    {lesson.status === 'COMPLETED' && lesson.score !== null && (
                      <p className="text-sm text-gray-500 mt-1">Score: {lesson.score}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

