'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle, Loader2, Award } from 'lucide-react';
import CleanerPortalNav from '@/components/cleaner/CleanerPortalNav';

interface ModuleProgress {
  slug: string;
  title: string;
  description: string;
  order: number;
  kind: string;
  completed: boolean;
  completedAt: string | null;
  quizScore: number | null;
  quizPath?: string;
}

interface TrainingData {
  status: string;
  modulesCompleted: number;
  modulesTotal: number;
  quizScore: number | null;
  certifiedAt: string | null;
  modules: ModuleProgress[];
}

export default function CleanerTrainingPage() {
  const router = useRouter();
  const [data, setData] = useState<TrainingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cleaner/training')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 401) router.push('/cleaners/login');
          throw new Error(json.error || 'Failed to load training');
        }
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const moduleHref = (mod: ModuleProgress) => {
    if (mod.kind === 'quiz' && mod.quizPath) return mod.quizPath;
    return `/cleaner/training/${mod.slug}`;
  };

  const actionLabel = (mod: ModuleProgress) => {
    if (mod.completed) return 'Review';
    if (mod.kind === 'quiz') return 'Start Quiz';
    return mod.order === 1 ? 'Start' : 'Continue';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-red-600">{error || 'Unable to load training'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <CleanerPortalNav />

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">VelocityMaid Certification</h1>
          <p className="mt-1 text-gray-600">
            Complete all modules and pass the quiz to receive live job assignments.
          </p>
        </div>

        {data.status === 'CERTIFIED' && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-900">
            <Award className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium">Certified</p>
              {data.certifiedAt && (
                <p className="text-sm">
                  Completed {new Date(data.certifiedAt).toLocaleDateString()}
                  {data.quizScore != null ? ` · Quiz score ${data.quizScore}%` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          Progress: {data.modulesCompleted} / {data.modulesTotal} required modules
        </div>

        <div className="space-y-4">
          {data.modules.map((mod) => (
            <div
              key={mod.slug}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {mod.completed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Module {mod.order}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900">{mod.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{mod.description}</p>
                    {mod.quizScore != null && (
                      <p className="mt-1 text-xs text-green-700">Quiz score: {mod.quizScore}%</p>
                    )}
                  </div>
                </div>
                <Link
                  href={moduleHref(mod)}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {actionLabel(mod)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
