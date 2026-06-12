import { DollarSign } from 'lucide-react';

interface PriceBreakdownProps {
  subtotal: number | null;
  fees: number;
  total: number | null;
  currency?: string;
  depositAmount?: number | null;
  amountPaid?: number | null;
  balanceDue?: number | null;
  paymentStatus?: string;
}

export default function PriceBreakdown({
  subtotal,
  fees,
  total,
  currency = 'USD',
  depositAmount,
  amountPaid,
  balanceDue,
  paymentStatus,
}: PriceBreakdownProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const showDepositBreakdown =
    depositAmount != null ||
    amountPaid != null ||
    (balanceDue != null && balanceDue > 0);

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>
      <div className="space-y-2 text-sm">
        {subtotal !== null && (
          <div className="flex justify-between text-gray-600">
            <span>Service total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        )}
        {showDepositBreakdown && (
          <>
            {depositAmount != null && (
              <div className="flex justify-between text-gray-600">
                <span>Booking deposit</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            )}
            {amountPaid != null && (
              <div className="flex justify-between text-gray-600">
                <span>Paid to date</span>
                <span className="text-green-700">{formatCurrency(amountPaid)}</span>
              </div>
            )}
            {balanceDue != null && balanceDue > 0 && paymentStatus === 'BALANCE_DUE' && (
              <div className="flex justify-between text-orange-700 font-medium">
                <span>Remaining balance</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </>
        )}
        {fees > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Fees</span>
            <span>{formatCurrency(fees)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-900">Quoted total</span>
          <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
