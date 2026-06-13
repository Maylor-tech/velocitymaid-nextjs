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
  if (status === 'CERTIFIED') return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="flex-1">
        <p className="font-medium">
          Training incomplete — complete your VelocityMaid certification before accepting live jobs.
        </p>
        <p className="mt-1 text-sm text-amber-800">
          Progress: {modulesCompleted} of {modulesTotal} modules
          {status === 'IN_PROGRESS' ? ' (in progress)' : ''}. Test jobs may still appear during onboarding.
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
