'use client';

/**
 * QuizForm Component
 * 
 * Interactive quiz form with multiple choice questions
 */

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizFormProps {
  quizData: QuizData;
  lessonId: string;
  onSubmit: (result: { score: number; passed: boolean; correct: number; total: number }) => void;
}

export default function QuizForm({ quizData, lessonId, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<number[]>(new Array(quizData.questions.length).fill(-1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
    setError(null); // Clear error when user changes answer
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if all questions are answered
    if (answers.some((answer) => answer === -1)) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/training/lesson/${lessonId}/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();

      if (result.success) {
        onSubmit({
          score: result.score,
          passed: result.passed,
          correct: result.correct,
          total: result.total,
        });
      } else {
        setError(result.error || 'Failed to submit quiz');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = !answers.some((answer) => answer === -1);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {quizData.questions.map((question, questionIndex) => (
        <div key={questionIndex} className="border-b border-gray-200 pb-6 last:border-b-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {questionIndex + 1}. {question.question}
          </h3>
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  answers[questionIndex] === optionIndex
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={optionIndex}
                  checked={answers[questionIndex] === optionIndex}
                  onChange={() => handleAnswerChange(questionIndex, optionIndex)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={submitting || !allAnswered}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Submit Quiz
            </>
          )}
        </button>
      </div>
    </form>
  );
}


