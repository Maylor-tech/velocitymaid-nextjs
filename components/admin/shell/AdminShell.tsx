'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { Logo } from '@/components/vm/Logo';
import { isPathAllowedForBranchScopedAdmin } from '@/lib/auth/adminScope';
import { ADMIN_NAV_GROUPS, type AdminNavGroup } from './adminNav';
import { AdminTopBar } from './AdminTopBar';
import { brandAssets } from '@/lib/brand/assets';
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
  /** Matches the top-bar branch control (e.g. "All branches" / "Vermont"). */
  branchScopeLabel: string;
  setBranchScopeLabel: (label: string) => void;
  signingOut: boolean;
  signOutError: string | null;
  requestSignOut: () => void;
};

const AdminShellContext = createContext<AdminShellContextValue>({
  branchScopeLabel: 'All branches',
  setBranchScopeLabel: () => {},
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
  /**
   * Override pathname for nav active matching (local-dev fixtures only).
   * Real /admin/* routes leave this unset and use usePathname().
   */
  activePath?: string;
}

function groupsFor(isBranchScoped: boolean): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.flatMap((group) => {
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
    <nav className="flex flex-col gap-[5px]" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.id}>
          {group.label ? (
            <p className="px-3 pb-1 font-body text-[10px] font-bold uppercase tracking-wider text-vm-white/40">
              {group.label}
            </p>
          ) : null}
          <div className="flex flex-col gap-[5px]">
            {group.items.map((item) => {
              const active = item.match?.(pathname) ?? pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-[10px] px-[15px] py-3 font-body text-sm no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-vm-navy ${
                    active
                      ? 'bg-vm-nav-active font-semibold text-vm-white shadow-[inset_3px_0_0_0_rgb(var(--vm-cyan))]'
                      : 'font-medium text-vm-nav-text hover:bg-vm-white/5 hover:text-vm-white'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
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
      className={`${minHeightClass} inline-flex items-center gap-2 font-body text-sm font-semibold text-vm-nav-text outline-none hover:bg-vm-white/5 hover:text-vm-white focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:opacity-60 ${className ?? ''}`}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}

function accountInitials(userEmail?: string): string {
  const local = userEmail?.split('@')[0] || '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
  }
  return (local.slice(0, 2) || 'AU').toUpperCase();
}

function AccountMenu() {
  const { userEmail, isOwner, isBranchScoped, signingOut, requestSignOut } =
    useAdminShell();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const role = adminRoleLabel({ isOwner, isBranchScoped });
  const initials = accountInitials(userEmail);

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
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>
      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label="Account menu"
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
              role="menuitem"
              onClick={() => {
                setOpen(false);
                requestSignOut();
              }}
              disabled={signingOut}
              aria-busy={signingOut || undefined}
              className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 font-body text-sm font-semibold text-vm-nav-text outline-none hover:bg-vm-white/5 hover:text-vm-white focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
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
  activePath,
}: AdminShellProps) {
  const pathname = usePathname();
  const navPath = activePath || pathname;
  const [needsCleaner, setNeedsCleaner] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [branchScopeLabel, setBranchScopeLabel] = useState(
    isBranchScoped && branchName ? branchName : 'All branches'
  );
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

  const branchLabelEl = (
    <p className="mt-2 px-1 font-body text-[11px] text-vm-nav-muted">
      {branchScopeLabel}
    </p>
  );

  return (
    <AdminShellContext.Provider
      value={{
        userEmail,
        isOwner,
        isBranchScoped,
        branchName,
        branchScopeLabel,
        setBranchScopeLabel,
        signingOut,
        signOutError,
        requestSignOut,
      }}
    >
      <div className="flex min-h-screen flex-col bg-vm-surface md:flex-row">
        <header className="flex items-center justify-between border-b border-vm-navy bg-vm-navy px-4 py-3 md:hidden">
          <Link href={homeHref} aria-label="VelocityMaid Admin home" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandAssets.compactReversed}
              alt="VelocityMaid"
              width={104}
              height={26}
              className="h-[26px] w-auto object-contain object-left"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-3 font-body text-sm font-semibold text-vm-white outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-nav"
          >
            {menuOpen ? (
              <X className="h-5 w-5 shrink-0" aria-hidden />
            ) : (
              <Menu className="h-5 w-5 shrink-0" aria-hidden />
            )}
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </header>
        {menuOpen && (
          <div
            id="admin-mobile-nav"
            className="bg-vm-navy px-3.5 py-4 md:hidden"
          >
            <p className="mb-3 px-3 font-body text-[11px] text-vm-white/50">
              {branchScopeLabel}
            </p>
            <NavLinks groups={groups} pathname={navPath} onNavigate={() => setMenuOpen(false)} />
            {assignmentNote}
            <div className="mt-4 border-t border-vm-white/10 px-1 pt-3">
              <p className="px-2 font-body text-[11px] text-vm-white/50">
                {role}
                {userEmail ? ` · ${userEmail}` : ''}
              </p>
              <SignOutButton className="mt-1 w-full rounded-md px-3 text-left" />
              {signOutError && (
                <p className="mt-2 px-2 font-body text-xs text-vm-nav-text" role="alert">
                  {signOutError}
                </p>
              )}
            </div>
          </div>
        )}

        <aside className="hidden w-[250px] shrink-0 flex-col gap-6 bg-vm-navy px-3.5 py-[22px] md:flex">
          <div className="px-2">
            <Link href={homeHref} aria-label="VelocityMaid Admin home" className="block w-[200px]">
              <Logo
                tone="dark"
                height={50}
                className="h-auto w-[200px] object-contain object-left"
              />
            </Link>
            {branchLabelEl}
          </div>
          <NavLinks groups={groups} pathname={navPath} />
          {assignmentNote}
          <div className="mt-auto border-t border-vm-white/10 px-1 pt-4">
            <p className="px-2 font-body text-[11px] text-vm-nav-muted">
              {role}
              {userEmail ? ` · ${userEmail}` : ''}
            </p>
            <SignOutButton className="mt-1 w-full rounded-md px-3 text-left" />
            {signOutError && (
              <p className="mt-2 px-2 font-body text-xs text-vm-nav-text" role="alert">
                {signOutError}
              </p>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-vm-canvas">
          <Suspense fallback={<div className="min-h-[77px] border-b border-vm-line bg-vm-surface" />}>
            <AdminTopBar
              isBranchScoped={isBranchScoped}
              isOwner={isOwner}
              branchName={branchName}
              accountMenu={<AccountMenu />}
              signOutError={signOutError}
              onBranchScopeLabelChange={setBranchScopeLabel}
            />
          </Suspense>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
        </div>
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
  return (
    <div className="flex min-h-[77px] flex-col gap-3 border-b border-vm-line bg-vm-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-bold text-vm-navy">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 font-body text-[13px] text-vm-muted">{subtitle}</p>
        )}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3.5">{actions}</div> : null}
    </div>
  );
}

export function useAdminShell() {
  return useContext(AdminShellContext);
}
