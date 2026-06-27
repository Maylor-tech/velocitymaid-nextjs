/**
 * TrainingModuleCard Component
 * 
 * Displays a training module with progress and status
 */

import Link from 'next/link';
import { CheckCircle2, Circle, PlayCircle, ArrowRight } from 'lucide-react';
import ProgressBar from './ProgressBar';

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

interface TrainingModuleCardProps {
  module: Module;
}

export default function TrainingModuleCard({ module }: TrainingModuleCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-vm-success" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-vm-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 bg-vm-success-bg text-vm-success rounded-full text-sm font-medium">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-3 py-1 bg-vm-cyan-tint text-blue-800 rounded-full text-sm font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-vm-text rounded-full text-sm font-medium">
            Not Started
          </span>
        );
    }
  };

  const getActionButton = () => {
    if (module.status === 'NOT_STARTED') {
      return (
        <>
          <PlayCircle className="w-4 h-4" />
          Start Module
        </>
      );
    } else if (module.status === 'COMPLETED') {
      return (
        <>
          <CheckCircle2 className="w-4 h-4" />
          Review Module
        </>
      );
    } else {
      return (
        <>
          <ArrowRight className="w-4 h-4" />
          Continue Module
        </>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">{getStatusIcon(module.status)}</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-vm-text mb-2">{module.title}</h2>
            <p className="text-vm-muted mb-3">{module.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              {getStatusBadge(module.status)}
              <span className="text-sm text-vm-muted">
                {module.progress.completed} of {module.progress.total} lessons completed
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar
        completed={module.progress.completed}
        total={module.progress.total}
        className="mb-4"
      />

      <Link
        href={`/cleaners/training/module/${module.slug}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-medium"
      >
        {getActionButton()}
      </Link>
    </div>
  );
}


