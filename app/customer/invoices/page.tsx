import { redirect } from 'next/navigation';

export default function CustomerInvoicesRedirectPage() {
  redirect('/customer/payments?tab=invoices');
}
