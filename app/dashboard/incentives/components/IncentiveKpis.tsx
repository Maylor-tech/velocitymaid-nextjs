'use client';

interface IncentiveKpisProps {
  totalBonus: number;
  njBonus: number;
  vtBonus: number;
  topPerformer?: {
    cleanerName: string;
    tier: string;
  };
  top3Performers: Array<{
    cleanerName: string;
    tier: string;
    bonusAmount: number;
  }>;
}

export default function IncentiveKpis({
  totalBonus,
  njBonus,
  vtBonus,
  topPerformer,
  top3Performers,
}: IncentiveKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
        <p className="text-sm font-medium text-vm-muted mb-1">Total Bonus Payout</p>
        <p className="text-3xl font-bold text-vm-text">${totalBonus.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <p className="text-sm font-medium text-vm-muted mb-1">NJ Bonus</p>
        <p className="text-3xl font-bold text-vm-text">${njBonus.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-vm-success">
        <p className="text-sm font-medium text-vm-muted mb-1">VT Bonus</p>
        <p className="text-3xl font-bold text-vm-text">${vtBonus.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Top Performer</p>
        <p className="text-xl font-bold text-vm-text">{topPerformer?.cleanerName || 'N/A'}</p>
        {topPerformer && (
          <p className="text-xs text-vm-muted mt-1">{topPerformer.tier}</p>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Top 3 Avg Bonus</p>
        <p className="text-3xl font-bold text-vm-text">
          ${top3Performers.length > 0
            ? (top3Performers.reduce((sum, p) => sum + p.bonusAmount, 0) / top3Performers.length).toFixed(2)
            : '0.00'}
        </p>
      </div>
    </div>
  );
}




