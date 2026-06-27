'use client';

interface BranchData {
  branch: 'new_jersey' | 'vermont';
  jobs: number;
  revenue: number;
  costEstimate: number;
  profit: number;
  margin: number;
}

interface BranchBreakdownTableProps {
  newJersey: Omit<BranchData, 'branch'>;
  vermont: Omit<BranchData, 'branch'>;
}

export default function BranchBreakdownTable({ newJersey, vermont }: BranchBreakdownTableProps) {
  const branches: BranchData[] = [
    { branch: 'new_jersey', ...newJersey },
    { branch: 'vermont', ...vermont },
  ];

  const total = {
    jobs: newJersey.jobs + vermont.jobs,
    revenue: newJersey.revenue + vermont.revenue,
    costEstimate: newJersey.costEstimate + vermont.costEstimate,
    profit: newJersey.profit + vermont.profit,
    margin: newJersey.revenue + vermont.revenue > 0
      ? ((newJersey.profit + vermont.profit) / (newJersey.revenue + vermont.revenue)) * 100
      : 0,
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-vm-text mb-4">Branch Breakdown</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Branch
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Jobs
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Cost Estimate
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Profit
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Margin %
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {branches.map((branch) => (
            <tr key={branch.branch} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    branch.branch === 'new_jersey'
                      ? 'bg-vm-cyan-tint text-blue-800'
                      : 'bg-vm-success-bg text-vm-success'
                  }`}
                >
                  {branch.branch === 'new_jersey' ? 'New Jersey' : 'Vermont'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">
                {branch.jobs}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">
                ${branch.revenue.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                ${branch.costEstimate.toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                  branch.profit >= 0 ? 'text-vm-success' : 'text-red-600'
                }`}
              >
                ${branch.profit >= 0 ? '+' : ''}{branch.profit.toFixed(2)}
              </td>
              <td
                className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                  branch.margin >= 0 ? 'text-vm-success' : 'text-red-600'
                }`}
              >
                {branch.margin.toFixed(1)}%
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">Total</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">{total.jobs}</td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">
              ${total.revenue.toFixed(2)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">
              ${total.costEstimate.toFixed(2)}
            </td>
            <td
              className={`px-4 py-3 whitespace-nowrap text-sm ${
                total.profit >= 0 ? 'text-vm-success' : 'text-red-600'
              }`}
            >
              ${total.profit >= 0 ? '+' : ''}{total.profit.toFixed(2)}
            </td>
            <td
              className={`px-4 py-3 whitespace-nowrap text-sm ${
                total.margin >= 0 ? 'text-vm-success' : 'text-red-600'
              }`}
            >
              {total.margin.toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}




