'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { isPathAllowedForBranchScopedAdmin } from '@/lib/auth/adminScope';
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from './adminNav';

const AdminShellContext = createContext<{
  userEmail?: string;
  isBranchScoped?: boolean;
}>({});

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  branchName?: string;
  isBranchScoped?: boolean;
}

function groupsFor(isBranchScoped: boolean): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => {
    if (isBranchScoped && group.id === 'money') return [];
    const items = group.items.filter(
      (item) => !isBranchScoped || isPathAllowedForBranchScopedAdmin(item.href)
    );
    if (items.length === 0) return [];
    return [{ ...group, items }];
  });
}

function NavLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-1 font-body text-[10px] font-bold uppercase tracking-wider text-vm-white/40">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.match?.(pathname) ?? pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 font-body text-sm no-underline transition-colors ${
                    active
                      ? 'bg-vm-cyan font-semibold text-vm-navy'
                      : 'font-medium text-vm-white/70 hover:bg-vm-white/5 hover:text-vm-white'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  userEmail,
  branchName,
  isBranchScoped = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const [needsCleaner, setNeedsCleaner] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = groupsFor(isBranchScoped);
  const homeHref = '/admin';

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/dashboard/command-center', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setNeedsCleaner(data.data?.desk?.cards?.needsCleaner ?? 0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const assignmentNote =
    needsCleaner != null && needsCleaner > 0 ? (
      <div className="mt-7 rounded-lg bg-vm-white/5 p-3.5">
        <p className="font-body text-xs leading-relaxed text-vm-white/70">
          {needsCleaner} job{needsCleaner === 1 ? '' : 's'} need a cleaner.
        </p>
        <Link
          href="/admin?list=cleaner"
          className="mt-1 inline-block font-body text-xs font-semibold text-vm-cyan no-underline hover:underline"
        >
          Needs a cleaner
        </Link>
      </div>
    ) : null;

  return (
    <AdminShellContext.Provider value={{ userEmail, isBranchScoped }}>
      <div className="flex min-h-screen flex-col bg-vm-surface md:flex-row">
        <header className="flex items-center justify-between border-b border-vm-navy bg-vm-navy px-4 py-3 md:hidden">
          <Link href={homeHref} aria-label="VelocityMaid Admin home" className="block max-w-[160px]">
            <BrandLogo theme="dark" size="sm" showTagline={false} />
          </Link>
          <button
            type="button"
            className="rounded-md px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-vm-white"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </header>
        {menuOpen && (
          <div className="bg-vm-navy px-3.5 py-4 md:hidden">
            {branchName && (
              <p className="mb-3 px-3 font-body text-[11px] text-vm-white/50">{branchName}</p>
            )}
            <NavLinks groups={groups} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            {assignmentNote}
          </div>
        )}

        <aside className="hidden w-[232px] shrink-0 flex-col bg-vm-navy px-3.5 py-5 md:flex">
          <div className="px-2.5 pb-6">
            <Link href={homeHref} aria-label="VelocityMaid Admin home" className="block max-w-[200px]">
              <BrandLogo theme="dark" size="sm" showTagline={false} />
            </Link>
            {branchName && (
              <p className="mt-2 px-1 font-body text-[11px] text-vm-white/50">{branchName}</p>
            )}
          </div>
          <NavLinks groups={groups} pathname={pathname} />
          {assignmentNote}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AdminShellContext.Provider>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  userEmail: userEmailProp,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userEmail?: string;
}) {
  const { userEmail: userEmailFromShell } = useContext(AdminShellContext);
  const userEmail = userEmailProp ?? userEmailFromShell;

  const initials =
    userEmail
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'AU';

  return (
    <header className="flex flex-col gap-3 border-b border-vm-border bg-vm-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div>
        <h1 className="font-heading text-xl font-bold text-vm-navy">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 font-body text-[13px] text-vm-muted">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3.5">
        {actions}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-vm-navy font-heading text-xs font-bold text-vm-white"
          title={userEmail}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

export function useAdminShell() {
  return useContext(AdminShellContext);
}
