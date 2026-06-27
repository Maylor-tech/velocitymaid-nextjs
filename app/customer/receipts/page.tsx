import { redirect } from 'next/navigation';

export default function CustomerReceiptsRedirectPage() {
  redirect('/customer/payments?tab=receipts');
}
