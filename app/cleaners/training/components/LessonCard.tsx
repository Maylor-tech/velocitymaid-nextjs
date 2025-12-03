/**
 * LessonCard Component
 * 
 * Displays a lesson with status and navigation
 */

import Link from 'next/link';
import { CheckCircle2, Circle, PlayCircle, ArrowLeft } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  order: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score: number | null;
  completedAt: string | null;
}

interface LessonCardProps {
  lesson: Lesson;
  moduleSlug: string;
}

export default function LessonCard({ lesson, moduleSlug }: LessonCardProps) {
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

  return (
    <Link
      href={`/cleaners/training/module/${moduleSlug}/lesson/${lesson.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div>{getStatusIcon(lesson.status)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
              {getStatusBadge(lesson.status)}
            </div>
            {lesson.status === 'COMPLETED' && lesson.score !== null && (
              <p className="text-sm text-gray-600">Score: {lesson.score}%</p>
            )}
          </div>
        </div>
        <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
      </div>
    </Link>
  );
}

