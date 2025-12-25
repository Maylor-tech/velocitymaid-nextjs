import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyCustomerSessionToken, COOKIE_NAME } from '../../lib/customerSession';
import { prisma } from '../../lib/prisma';

/**
 * Customer Portal Home
 * 
 * Redirects to /customer/jobs if logged in, otherwise to /customer/login
 */
export default async function CustomerPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const session = await verifyCustomerSessionToken(token);

  if (session) {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });
    
    if (customer) {
      redirect('/customer/jobs');
    }
  }

  redirect('/customer/login');
}


