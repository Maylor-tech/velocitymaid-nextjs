'use client';

interface BranchSummaryCardProps {
  branch: 'new_jersey' | 'vermont';
  jobs: number;
  revenue: number;
  avgRevenuePerJob: number;
  profit: number;
  margin: number;
}

export default function BranchSummaryCard({
  branch,
  jobs,
  revenue,
  avgRevenuePerJob,
  profit,
  margin,
}: BranchSummaryCardProps) {
  const isNewJersey = branch === 'new_jersey';
  const branchName = isNewJersey ? 'New Jersey' : 'Vermont';
  const badgeColor = isNewJersey
    ? 'bg-blue-100 text-blue-800'
    : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{branchName} Snapshot</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
          {branchName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{jobs}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${revenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Avg per Job</p>
          <p className="text-2xl font-bold text-gray-900">${avgRevenuePerJob.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
          <p className={`text-2xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {margin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Profit</span>
          <span className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${profit >= 0 ? '+' : ''}{profit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}



