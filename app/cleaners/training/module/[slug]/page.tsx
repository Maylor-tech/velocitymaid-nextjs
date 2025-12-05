"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import LessonCard from '@/app/cleaners/training/components/LessonCard';
import ProgressBar from '@/app/cleaners/training/components/ProgressBar';

interface Lesson {
  id: string;
  title: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  completedAt: string | null;
}

interface ModuleData {
  id: string;
  slug: string;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: {
    completed: number;
    total: number;
  };
}

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [module, setModule] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchModuleData();
    }
  }, [slug]);

  const fetchModuleData = async () => {
    try {
      const response = await fetch('/api/training/modules');
      const result = await response.json();

      if (result.success) {
        const foundModule = result.modules.find((m: ModuleData) => m.slug === slug);
        if (foundModule) {
          setModule(foundModule);
        } else {
          setError('Module not found');
        }
      } else {
        if (result.error === 'Not authenticated') {
          router.push('/cleaners/login');
        } else {
          setError(result.error || 'Failed to load module');
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
          <p className="mt-4 text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Module not found'}</p>
          <button
            onClick={() => router.push('/cleaners/training')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Training
          </button>
        </div>
      </div>
    );
  }

  const nextLesson = module.lessons.find((l) => l.status !== 'COMPLETED');
  const allCompleted = module.progress.completed === module.progress.total;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cleaners/training"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Training
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
          <p className="text-gray-600">{module.description}</p>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
            <span className="text-sm text-gray-600">
              {module.progress.completed} of {module.progress.total} lessons completed
            </span>
          </div>
          <ProgressBar
            completed={module.progress.completed}
            total={module.progress.total}
          />
        </div>

        {/* Lessons List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lessons</h2>
          {module.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} moduleSlug={module.slug} />
          ))}
        </div>

        {/* Completion Message */}
        {allCompleted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                Congratulations! You've completed all lessons in this module.
              </p>
            </div>
          </div>
        )}

        {/* Start/Continue Button */}
        {nextLesson && (
          <div className="mt-6">
            <Link
              href={`/cleaners/training/module/${module.slug}/lesson/${nextLesson.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {nextLesson.status === 'NOT_STARTED' ? (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Start {nextLesson.title}
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Continue {nextLesson.title}
                </>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
