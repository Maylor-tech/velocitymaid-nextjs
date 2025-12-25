import { DollarSign } from 'lucide-react';

interface PriceBreakdownProps {
  subtotal: number | null;
  fees: number;
  total: number | null;
  currency?: string;
}

export default function PriceBreakdown({ subtotal, fees, total, currency = 'USD' }: PriceBreakdownProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>
      <div className="space-y-2 text-sm">
        {subtotal !== null && (
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        )}
        {fees > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Fees</span>
            <span>{formatCurrency(fees)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}















