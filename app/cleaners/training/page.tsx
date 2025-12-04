"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import TrainingModuleCard from '@/app/cleaners/training/components/TrainingModuleCard';

interface Lesson {
  id: string;
  title: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  completedAt: string | null;
}

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lessons: Lesson[];
  progress: {
    completed: number;
    total: number;
  };
}

interface TrainingData {
  modules: Module[];
  trainingStatus: {
    overallStatus: string;
    lastModuleSlug: string | null;
    updatedAt: string;
  } | null;
}

export default function TrainingPage() {
  const router = useRouter();
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const response = await fetch('/api/training/modules');
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        if (result.error === 'Not authenticated') {
          router.push('/cleaners/login');
        } else {
          setError(result.error || 'Failed to load training data');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/cleaners/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { modules, trainingStatus } = data;
  const hasInProgress = modules.some((m) => m.status === 'IN_PROGRESS');
  const nextModule = hasInProgress
    ? modules.find((m) => m.status === 'IN_PROGRESS')
    : modules.find((m) => m.status === 'NOT_STARTED');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Jamaica Training Portal</h1>
            <Link
              href="/cleaners/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-600">
            Complete all training modules to start receiving job assignments.
          </p>
        </div>

        {/* Continue CTA */}
        {nextModule && hasInProgress && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-medium text-blue-900">Continue where you left off</p>
                <p className="text-sm text-blue-700">
                  {nextModule.title} - {nextModule.progress.completed} of {nextModule.progress.total}{' '}
                  lessons completed
                </p>
              </div>
              <Link
                href={`/cleaners/training/module/${nextModule.slug}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module) => (
            <TrainingModuleCard key={module.id} module={module} />
          ))}
        </div>

        {/* Overall Status */}
        {trainingStatus && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Overall Training Status:{' '}
              <span className="font-medium capitalize">
                {trainingStatus.overallStatus.toLowerCase().replace('_', ' ')}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
