'use client';

interface PayoutKpisProps {
  totalNetPayouts: number;
  njTotal: number;
  vtTotal: number;
  cleanersCount: number;
  avgPayout: number;
}

export default function PayoutKpis({
  totalNetPayouts,
  njTotal,
  vtTotal,
  cleanersCount,
  avgPayout,
}: PayoutKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
        <p className="text-sm font-medium text-vm-muted mb-1">Total Net Payouts</p>
        <p className="text-3xl font-bold text-vm-text">${totalNetPayouts.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <p className="text-sm font-medium text-vm-muted mb-1">NJ Total</p>
        <p className="text-3xl font-bold text-vm-text">${njTotal.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <p className="text-sm font-medium text-vm-muted mb-1">VT Total</p>
        <p className="text-3xl font-bold text-vm-text">${vtTotal.toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Cleaners</p>
        <p className="text-3xl font-bold text-vm-text">{cleanersCount}</p>
        <p className="text-xs text-vm-muted mt-1">With payouts</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Avg Payout</p>
        <p className="text-3xl font-bold text-vm-text">${avgPayout.toFixed(2)}</p>
      </div>
    </div>
  );
}




