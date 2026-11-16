'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { isPathAllowedForBranchScopedAdmin } from '@/lib/auth/adminScope';
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from './adminNav';
import {
  adminRoleLabel,
  beginAdminSignOut,
  isAdminSignOutPending,
} from './adminSignOut';

type AdminShellContextValue = {
  userEmail?: string;
  isOwner?: boolean;
  isBranchScoped?: boolean;
  branchName?: string;
  signingOut: boolean;
  signOutError: string | null;
  requestSignOut: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue>({
  signingOut: false,
  signOutError: null,
  requestSignOut: () => {},
});

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string;
  branchName?: string;
  isOwner?: boolean;
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

function SignOutButton({
  className,
  minHeightClass = 'min-h-11',
}: {
  className?: string;
  minHeightClass?: string;
}) {
  const { signingOut, requestSignOut } = useAdminShell();
  return (
    <button
      type="button"
      onClick={requestSignOut}
      disabled={signingOut}
      aria-busy={signingOut || undefined}
      className={`${minHeightClass} outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan ${className ?? ''}`}
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

function AccountMenu() {
  const { userEmail, isOwner, isBranchScoped, signingOut, requestSignOut } =
    useAdminShell();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const role = adminRoleLabel({ isOwner, isBranchScoped });

  const initials =
    userEmail
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'AU';

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    if (signingOut) setOpen(false);
  }, [signingOut]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-11 min-w-11 items-center justify-center rounded-full bg-vm-navy font-heading text-xs font-bold text-vm-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-vm-cyan"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        aria-label={`Admin account menu (${role}${userEmail ? `, ${userEmail}` : ''})`}
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Admin account"
          className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-vm-navy/15 bg-vm-navy p-3 shadow-lg"
        >
          <p className="font-heading text-sm font-bold text-vm-white">Admin account</p>
          <p className="mt-0.5 font-body text-xs text-vm-white/60">
            {role}
            {userEmail ? ` · ${userEmail}` : ''}
          </p>
          <div className="mt-3 border-t border-vm-white/10 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                requestSignOut();
              }}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className="flex min-h-11 w-full items-center rounded-md px-2 font-body text-sm font-semibold text-red-300 outline-none hover:bg-vm-white/5 focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:opacity-60"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminShell({
  children,
  userEmail,
  branchName,
  isOwner = false,
  isBranchScoped = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const [needsCleaner, setNeedsCleaner] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const groups = groupsFor(isBranchScoped);
  const homeHref = '/admin';
  const role = adminRoleLabel({ isOwner, isBranchScoped });

  const requestSignOut = useCallback(() => {
    if (signingOut || isAdminSignOutPending()) return;
    setSignOutError(null);
    setSigningOut(true);
    const started = beginAdminSignOut();
    if (!started) {
      setSigningOut(false);
      setSignOutError('Could not sign out. Try again.');
    }
  }, [signingOut]);

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
    <AdminShellContext.Provider
      value={{
        userEmail,
        isOwner,
        isBranchScoped,
        branchName,
        signingOut,
        signOutError,
        requestSignOut,
      }}
    >
      <div className="flex min-h-screen flex-col bg-vm-surface md:flex-row">
        <header className="flex items-center justify-between border-b border-vm-navy bg-vm-navy px-4 py-3 md:hidden">
          <Link href={homeHref} aria-label="VelocityMaid Admin home" className="block max-w-[160px]">
            <BrandLogo theme="dark" size="sm" showTagline={false} />
          </Link>
          <button
            type="button"
            className="min-h-11 rounded-md px-3 py-2 font-heading text-xs font-bold uppercase tracking-wide text-vm-white"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
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
            <div className="mt-4 border-t border-vm-white/10 px-1 pt-3">
              <p className="px-2 font-body text-[11px] text-vm-white/50">
                {role}
                {userEmail ? ` · ${userEmail}` : ''}
              </p>
              <SignOutButton className="mt-1 w-full rounded-md px-3 text-left font-body text-sm font-semibold text-red-300 hover:bg-vm-white/5 disabled:opacity-60" />
              {signOutError && (
                <p className="mt-2 px-2 font-body text-xs text-red-300" role="alert">
                  {signOutError}
                </p>
              )}
            </div>
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
          <div className="mt-auto border-t border-vm-white/10 px-1 pt-4">
            <p className="px-2 font-body text-[11px] text-vm-white/50">
              {role}
              {userEmail ? ` · ${userEmail}` : ''}
            </p>
            <SignOutButton className="mt-1 w-full rounded-md px-3 text-left font-body text-sm font-semibold text-red-300 hover:bg-vm-white/5 disabled:opacity-60" />
            {signOutError && (
              <p className="mt-2 px-2 font-body text-xs text-red-300" role="alert">
                {signOutError}
              </p>
            )}
          </div>
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
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** @deprecated Identity comes from AdminShell context. */
  userEmail?: string;
}) {
  const shell = useAdminShell();

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
        <AccountMenu />
        {shell.signOutError && (
          <span className="sr-only" role="alert">
            {shell.signOutError}
          </span>
        )}
      </div>
    </header>
  );
}

export function useAdminShell() {
  return useContext(AdminShellContext);
}
