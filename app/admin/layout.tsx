import { headers } from 'next/headers';
import { getAdminAuthFromCookies } from '@/lib/auth/requireRole';
import { AdminShell } from '@/components/admin/shell/AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';
  const isLoginPage =
    pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  if (isLoginPage) {
    return <>{children}</>;
  }

  const auth = await getAdminAuthFromCookies();

  return (
    <AdminShell userEmail={auth?.email} branchName={auth?.branchName} isBranchScoped={!!auth?.branchId}>
      {children}
    </AdminShell>
  );
}
