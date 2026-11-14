'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

interface TrainingIncompleteBannerProps {
  modulesCompleted: number;
  modulesTotal: number;
  status: string;
}

export default function TrainingIncompleteBanner({
  modulesCompleted,
  modulesTotal,
  status,
}: TrainingIncompleteBannerProps) {
  // Authoritative cleaner-portal certification is module/quiz completion
  // (getCertificationSummary), not a separate TrainingStatus row.
  if (status === 'CERTIFIED') return null;

  const progressLabel =
    status === 'IN_PROGRESS'
      ? 'Certification in progress'
      : status === 'NOT_STARTED'
        ? 'Certification not started'
        : 'Certification incomplete';

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-medium">
          {progressLabel} — finish required modules and the certification quiz
          before treating yourself as certified for live work.
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Module progress: {modulesCompleted} of {modulesTotal} required modules.
          Assigned test or onboarding jobs may still appear while you complete
          training.
        </p>
        <Link
          href="/cleaner/training"
          className="mt-2 inline-block text-sm font-semibold text-amber-900 underline hover:text-amber-700"
        >
          Go to Training →
        </Link>
      </div>
    </div>
  );
}
