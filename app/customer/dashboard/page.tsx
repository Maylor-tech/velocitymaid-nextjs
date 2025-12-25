import { cookies } from 'next/headers';
import { verifyCustomerSessionToken, COOKIE_NAME } from '../../../lib/customerSession';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CustomerDashboardPage() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
    const session = await verifyCustomerSessionToken(token);

    if (!session) {
      // Middleware should normally prevent this, but just in case:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-700">Not authorized.</p>
        </div>
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });

    const jobs = await prisma.job.findMany({
      where: { customerId: session.customerId },
      orderBy: { preferredDate: 'asc' },
      take: 5,
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {customer?.firstName || customer?.email || 'Customer'}
            </h1>
            <p className="text-sm text-gray-500">
              Here&apos;s a quick view of your upcoming cleanings.
            </p>
          </div>
          <a
            href="/book"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
          >
            Book a new cleaning
          </a>
        </header>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming & Recent Cleanings
          </h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">
              No bookings found. Once you book, your cleanings will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <li key={job.id} className="py-3 text-sm flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.serviceType || 'Home Cleaning'}
                    </p>
                    <p className="text-gray-500">
                      {job.address || 'Your address'} ·{' '}
                      {job.status || 'PENDING'}
                    </p>
                  </div>
                  <div className="text-right text-gray-500">
                    {job.preferredDate
                      ? new Date(job.preferredDate).toLocaleString()
                      : 'TBD'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
    );
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>
          <a
            href="/customer/login"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }
}
