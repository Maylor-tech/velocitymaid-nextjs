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
    <div className="mt-6 pt-6 border-t border-vm-navy/10">
      <h3 className="text-sm font-medium text-vm-text font-body mb-3">Pricing</h3>
      <div className="space-y-2 text-sm font-body">
        {subtotal !== null && (
          <div className="flex justify-between text-vm-muted">
            <span>Service total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        )}
        {showDepositBreakdown && (
          <>
            {depositAmount != null && (
              <div className="flex justify-between text-vm-muted">
                <span>Booking deposit</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            )}
            {amountPaid != null && (
              <div className="flex justify-between text-vm-muted">
                <span>Paid to date</span>
                <span className="text-vm-success">{formatCurrency(amountPaid)}</span>
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
          <div className="flex justify-between text-vm-muted">
            <span>Fees</span>
            <span>{formatCurrency(fees)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-vm-navy/10">
          <span className="font-medium text-vm-navy">Quoted total</span>
          <span className="font-medium text-vm-navy">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
