'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CleanerPortalNav from '@/components/cleaner/CleanerPortalNav';
import { TRAINING_PASSING_SCORE } from '@/lib/cleaners/trainingModules';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export default function CertificationQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    correctCount: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/cleaner/training/certification-quiz')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/cleaners/login');
          return;
        }
        const json = await res.json();
        if (json.success) setQuestions(json.questions);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.some((q) => answers[q.id] === undefined)) {
      alert('Please answer all questions.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/cleaner/training/certification-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult({
        scorePercent: json.scorePercent,
        passed: json.passed,
        correctCount: json.correctCount,
        total: json.total,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Submit failed');
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> All modules
        </Link>

        <h1 className="text-2xl font-semibold">Certification Quiz</h1>
        <p className="mt-1 text-gray-600">
          Passing score: {TRAINING_PASSING_SCORE}% ({questions.length} questions)
        </p>

        {result ? (
          <div
            className={`mt-6 rounded-xl border p-6 ${
              result.passed
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <p className="text-lg font-semibold">
              {result.passed ? 'You passed!' : 'Not quite — try again'}
            </p>
            <p className="mt-2">
              Score: {result.scorePercent}% ({result.correctCount}/{result.total} correct)
            </p>
            {result.passed ? (
              <Link
                href="/cleaner/training/certification-complete"
                className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
              >
                View certification →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                }}
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-white hover:bg-red-800"
              >
                Retake quiz
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {questions.map((q, idx) => (
              <fieldset
                key={q.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <legend className="font-medium text-gray-900">
                  {idx + 1}. {q.question}
                </legend>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === optIdx}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-800">{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
