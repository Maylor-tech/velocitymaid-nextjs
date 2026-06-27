'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import QuizForm from '../../../../components/QuizForm';

interface LessonData {
  id: string;
  title: string;
  content: string;
  quizJson: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
  } | null;
  module: {
    slug: string;
    title: string;
  };
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    try {
      const response = await fetch(`/api/training/lesson/${lessonId}`);
      const result = await response.json();

      if (result.success) {
        setLesson(result.lesson);
        // Mark lesson as started if not already
        if (result.lesson.status === 'NOT_STARTED') {
          await fetch(`/api/training/lesson/${lessonId}/start`, { method: 'POST' });
          // Refresh to get updated status
          const refreshResponse = await fetch(`/api/training/lesson/${lessonId}`);
          const refreshResult = await refreshResponse.json();
          if (refreshResult.success) {
            setLesson(refreshResult.lesson);
          }
        }
      } else {
        if (result.error === 'Not authenticated') {
          router.push('/cleaners/login');
        } else {
          setError(result.error || 'Failed to load lesson');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = (result: { score: number; passed: boolean; correct: number; total: number }) => {
    setQuizResult(result);
    setQuizSubmitted(true);
    // Refresh lesson data to get updated status
    fetchLessonData();
  };

  // Simple markdown to HTML converter
  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return `<h1 class="text-3xl font-bold text-vm-text mb-4 mt-6 first:mt-0">${line.substring(2)}</h1>`;
        }
        if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-semibold text-vm-text mb-3 mt-5">${line.substring(3)}</h2>`;
        }
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-semibold text-vm-text mb-2 mt-4">${line.substring(4)}</h3>`;
        }
        if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
          if (match) {
            return `<p class="mb-2"><strong class="text-vm-text">${match[1]}</strong>: <span class="text-vm-text">${match[2]}</span></p>`;
          }
        }
        if (line.startsWith('- ')) {
          return `<p class="mb-2 text-vm-text">${line.substring(2)}</p>`;
        }
        if (line.trim() === '') {
          return '<br />';
        }
        return `<p class="mb-3 text-vm-text">${line}</p>`;
      })
      .join('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Lesson not found'}</p>
          <button
            onClick={() => router.push(`/cleaners/training/module/${slug}`)}
            className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy"
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/cleaners/training/module/${slug}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {lesson.module.title}
          </Link>
          <h1 className="text-3xl font-bold text-vm-text mb-2">{lesson.title}</h1>
        </div>

        {/* Lesson Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(lesson.content),
            }}
          />
        </div>

        {/* Quiz Section */}
        {lesson.quizJson && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-vm-text mb-6">Quiz</h2>
            {quizSubmitted && quizResult ? (
              <div className="mb-6">
                <div
                  className={`p-6 rounded-lg mb-4 ${
                    quizResult.passed
                      ? 'bg-vm-success-bg border border-vm-success/30'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {quizResult.passed ? (
                      <CheckCircle2 className="w-6 h-6 text-vm-success" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <h3
                      className={`text-xl font-semibold ${
                        quizResult.passed ? 'text-vm-success' : 'text-red-900'
                      }`}
                    >
                      {quizResult.passed ? 'Congratulations!' : 'Not Quite There'}
                    </h3>
                  </div>
                  <p className={quizResult.passed ? 'text-vm-success' : 'text-red-800'}>
                    You scored {quizResult.score}% ({quizResult.correct} out of {quizResult.total}{' '}
                    correct)
                  </p>
                  {!quizResult.passed && (
                    <p className="text-red-700 mt-2">
                      You need 70% to pass. Please review the lesson and try again.
                    </p>
                  )}
                </div>
                {quizResult.passed && (
                  <div className="flex gap-4 flex-wrap">
                    <Link
                      href={`/cleaners/training/module/${slug}`}
                      className="px-6 py-3 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-medium"
                    >
                      Continue to Next Lesson
                    </Link>
                    <Link
                      href="/cleaners/training"
                      className="px-6 py-3 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Back to Training
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <QuizForm
                quizData={lesson.quizJson}
                lessonId={lessonId}
                onSubmit={handleQuizSubmit}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        {!quizSubmitted && (
          <div className="mt-6">
            <Link
              href={`/cleaners/training/module/${slug}`}
              className="px-6 py-3 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block"
            >
              Back to Module
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
