import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import CustomerLayout from './components/CustomerLayout';
import DatabaseErrorPage from './components/DatabaseErrorPage';
import { verifyCustomerSessionToken, COOKIE_NAME } from '../../lib/customerSession';
import { prisma } from '../../lib/prisma';

/**
 * Customer Portal Layout
 * 
 * Protects all /customer/* routes except login and verify
 * Login and verify pages are in (auth) route group and have their own layout
 */
export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';
  const isAuthPage = pathname.startsWith('/customer/login') || pathname.startsWith('/customer/verify');

  // Skip auth check for auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const session = await verifyCustomerSessionToken(token);

  // Check authentication for other routes
  if (!session) {
    redirect('/customer/login');
  }

  // Verify customer exists with error handling
  let customer;
  try {
    customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });
  } catch (error: any) {
    // Handle database connection errors
    console.error('Database error in customer layout:', error);
    
    // If it's a connection error, show a user-friendly message
    if (error.code === 'P1001' || error.message?.includes("Can't reach database server")) {
      // Return error page instead of crashing
      return <DatabaseErrorPage />;
    }
    
    // For other errors, redirect to login
    redirect('/customer/login');
  }

  if (!customer) {
    redirect('/customer/login');
  }

  return <CustomerLayout>{children}</CustomerLayout>;
}
