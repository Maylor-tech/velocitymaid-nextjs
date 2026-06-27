import { Suspense } from 'react';
import CustomerPaymentsPageClient from './CustomerPaymentsPageClient';

function PaymentsFallback() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-vm-cyan border-t-transparent" />
    </div>
  );
}

export default function CustomerPaymentsRoutePage() {
  return (
    <Suspense fallback={<PaymentsFallback />}>
      <CustomerPaymentsPageClient />
    </Suspense>
  );
}
