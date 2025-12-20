'use client';

import BranchSummaryCard from './BranchSummaryCard';

interface BranchData {
  jobs: number;
  revenue: number;
  avgRevenuePerJob: number;
  profit: number;
  margin: number;
}

interface BranchComparisonProps {
  newJersey: BranchData;
  vermont: BranchData;
}

export default function BranchComparison({ newJersey, vermont }: BranchComparisonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <BranchSummaryCard branch="new_jersey" {...newJersey} />
      <BranchSummaryCard branch="vermont" {...vermont} />
    </div>
  );
}




