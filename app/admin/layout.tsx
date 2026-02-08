import { headers } from 'next/headers';
import Link from 'next/link';
import { getAdminAuthFromCookies } from '@/lib/auth/requireRole';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';
  const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  if (isLoginPage) {
    return <>{children}</>;
  }

  const auth = await getAdminAuthFromCookies();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs" className="text-gray-900 hover:text-gray-700">
            <h1 className="text-lg font-semibold">Admin</h1>
          </Link>
          {auth?.branchName && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-800">
              Branch: {auth.branchName}
            </span>
          )}
        </div>
        {/* Right-side controls can go here (e.g. logout, nav links) */}
      </header>
      <main>{children}</main>
    </div>
  );
}
