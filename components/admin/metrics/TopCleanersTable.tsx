interface TopCleaner {
  cleanerId: string;
  name: string | null;
  email: string;
  jobsCompleted: number;
  averageRating: number | null;
  completionRate: number;
}

interface TopCleanersTableProps {
  cleaners: TopCleaner[];
}

export default function TopCleanersTable({ cleaners }: TopCleanersTableProps) {
  if (cleaners.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No cleaner data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jobs Completed
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Completion Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Average Rating
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {cleaners.map((cleaner) => (
            <tr key={cleaner.cleanerId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {cleaner.name || 'Unknown'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{cleaner.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{cleaner.jobsCompleted}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">
                    {cleaner.completionRate}%
                  </div>
                  <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${cleaner.completionRate}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {cleaner.averageRating !== null ? (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {cleaner.averageRating.toFixed(1)}
                    </span>
                    <span className="ml-1 text-yellow-400">★</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

















