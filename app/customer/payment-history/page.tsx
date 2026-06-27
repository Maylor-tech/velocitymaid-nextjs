import { redirect } from 'next/navigation';

export default function CustomerPaymentHistoryRedirectPage() {
  redirect('/customer/payments?tab=history');
}
