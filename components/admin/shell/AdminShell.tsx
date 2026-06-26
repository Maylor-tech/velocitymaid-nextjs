'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { ADMIN_NAV } from './adminNav';

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  branchName?: string;
}

export function AdminShell({ children, userEmail, branchName }: AdminShellProps) {
  const pathname = usePathname();
  const [unassignedJobs, setUnassignedJobs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/dashboard/operations', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setUnassignedJobs(data.unassignedJobs ?? 0);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-vm-surface">
      <aside className="flex w-[232px] shrink-0 flex-col bg-vm-navy px-3.5 py-5">
        <div className="px-2.5 pb-6">
          <Link href="/admin" aria-label="VelocityMaid Admin home">
            <BrandLogo theme="dark" size="sm" showTagline={false} />
          </Link>
          {branchName && (
            <p className="mt-2 px-1 font-body text-[11px] text-vm-white/50">
              {branchName}
            </p>
          )}
        </div>

        <nav className="flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => {
            const active = item.match?.(pathname) ?? pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
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
        </nav>

        {unassignedJobs != null && unassignedJobs > 0 && (
          <div className="mt-7 rounded-lg bg-vm-white/5 p-3.5">
            <p className="font-body text-xs leading-relaxed text-vm-white/70">
              {unassignedJobs} job{unassignedJobs === 1 ? '' : 's'} need a specialist
              assigned.
            </p>
            <Link
              href="/admin/jobs?needsAssignment=1"
              className="mt-1 inline-block font-body text-xs font-semibold text-vm-cyan no-underline hover:underline"
            >
              Assign now →
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Page chrome: title row + actions slot (matches DS kit header). */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  userEmail?: string;
}) {
  const initials =
    userEmail
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'AU';

  return (
    <header className="flex items-center justify-between border-b border-vm-border bg-vm-white px-7 py-4">
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
