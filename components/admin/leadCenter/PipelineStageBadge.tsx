import type { PipelineLeadStage } from '@prisma/client';
import { STAGE_COLORS, STAGE_LABELS } from '@/lib/leadCenter/types';

interface PipelineStageBadgeProps {
  stage: PipelineLeadStage;
  className?: string;
}

export function PipelineStageBadge({ stage, className = '' }: PipelineStageBadgeProps) {
  const colors = STAGE_COLORS[stage];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${colors.bg} ${colors.fg} ${className}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
