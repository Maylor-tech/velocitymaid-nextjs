import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import CustomerLayout from './components/CustomerLayout';
import { findCustomerById } from '@/utils/customerData';

/**
 * Customer Portal Layout
 * 
 * Protects all /customer/* routes (except /customer/login)
 * Redirects to login if not authenticated
 */
export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get('customerId')?.value;

  // Allow access to login page without auth
  // This check is handled in the login page itself

  // For all other pages, check authentication
  if (!customerId) {
    redirect('/customer/login');
  }

  // Verify customer exists
  const customer = findCustomerById(customerId);
  if (!customer) {
    redirect('/customer/login');
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}



