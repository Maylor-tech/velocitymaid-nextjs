'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import CleanerPortalNav from '@/components/cleaner/CleanerPortalNav';
import { getTrainingModule } from '@/lib/cleaners/trainingModules';

export default function CleanerTrainingModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleSlug = params.moduleSlug as string;
  const moduleDef = getTrainingModule(moduleSlug);

  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleDef) return;
    if (moduleDef.kind === 'quiz') {
      router.replace('/cleaner/training/certification-quiz');
      return;
    }
    fetch('/api/cleaner/training')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/cleaners/login');
          return;
        }
        const json = await res.json();
        const mod = json.modules?.find((m: { slug: string }) => m.slug === moduleSlug);
        setCompleted(Boolean(mod?.completed));
      })
      .finally(() => setLoading(false));
  }, [moduleSlug, moduleDef, router]);

  if (!moduleDef) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-vm-muted">Module not found.</p>
        <Link href="/cleaner/training" className="mt-2 text-blue-600 underline">
          Back to training
        </Link>
      </div>
    );
  }

  if (moduleDef.kind === 'completion') {
    return <CertificationCompleteView loading={loading} />;
  }

  const handleComplete = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cleaner/training/${moduleSlug}/complete`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to mark complete');
      setCompleted(true);
      setMessage('Module marked complete.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <CleanerPortalNav />
        <Link
          href="/cleaner/training"
          className="mb-4 inline-flex items-center gap-1 text-sm text-vm-muted hover:text-vm-text"
        >
          <ArrowLeft className="h-4 w-4" /> All modules
        </Link>

        <h1 className="text-2xl font-semibold text-vm-text">{moduleDef.title}</h1>
        <p className="mt-1 text-vm-muted">{moduleDef.description}</p>

        <div className="mt-6 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {moduleDef.sections?.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-medium text-vm-text">{section.heading}</h2>
              <p className="mt-2 text-vm-text leading-relaxed">{section.body}</p>
            </section>
          ))}

          {moduleDef.takeaways && moduleDef.takeaways.length > 0 && (
            <section className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900">Key takeaways</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                {moduleDef.takeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {completed ? (
            <div className="flex items-center gap-2 text-vm-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Completed</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className="rounded-lg bg-vm-navy px-6 py-3 font-medium text-white hover:bg-vm-navy disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Mark Module Complete'}
            </button>
          )}
          <Link
            href="/cleaner/training"
            className="text-center text-sm text-vm-muted underline sm:ml-auto"
          >
            Back to all modules
          </Link>
        </div>
        {message && <p className="mt-3 text-sm text-vm-muted">{message}</p>}
      </div>
    </div>
  );
}

function CertificationCompleteView({ loading }: { loading: boolean }) {
  const [certified, setCertified] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [certifiedAt, setCertifiedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cleaner/training')
      .then((res) => res.json())
      .then((json) => {
        setCertified(json.status === 'CERTIFIED');
        setQuizScore(json.quizScore);
        setCertifiedAt(json.certifiedAt);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl text-center">
        <CleanerPortalNav />
        {certified ? (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-vm-success" />
            <h1 className="mt-4 text-2xl font-semibold">Certification Complete</h1>
            <p className="mt-2 text-vm-muted">
              You are certified to accept VelocityMaid live jobs.
            </p>
            {quizScore != null && (
              <p className="mt-1 text-sm text-vm-muted">Quiz score: {quizScore}%</p>
            )}
            {certifiedAt && (
              <p className="text-sm text-vm-muted">
                Certified on {new Date(certifiedAt).toLocaleDateString()}
              </p>
            )}
            <Link
              href="/cleaner/jobs"
              className="mt-6 inline-block rounded-lg bg-vm-navy px-6 py-3 font-medium text-white hover:bg-vm-navy"
            >
              View My Jobs
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Certification pending</h1>
            <p className="mt-2 text-vm-muted">
              Complete all modules and pass the quiz to unlock this page.
            </p>
            <Link href="/cleaner/training" className="mt-4 text-blue-600 underline">
              Continue training
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
