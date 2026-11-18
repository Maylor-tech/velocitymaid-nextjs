'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  branchScopeLabel,
  type BranchOption,
} from '@/lib/admin/branchScopeLabel';

const NEW_BOOKING_HREF = '/admin/jobs/new';

const FALLBACK_BRANCHES: BranchOption[] = [
  { id: 'vermont', name: 'Vermont', slug: 'vermont' },
  { id: 'new-jersey', name: 'New Jersey', slug: 'new-jersey' },
];

export function AdminTopBar({
  isBranchScoped = false,
  isOwner = false,
  branchName,
  accountMenu,
  signOutError,
  onBranchScopeLabelChange,
}: {
  isBranchScoped?: boolean;
  isOwner?: boolean;
  branchName?: string;
  accountMenu: React.ReactNode;
  signOutError?: string | null;
  onBranchScopeLabelChange?: (label: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [searchDraft, setSearchDraft] = useState(
    searchParams.get('search') || ''
  );

  const sampleData =
    (process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV) !==
    'production';

  const branchParam = searchParams.get('branchId') || '';

  useEffect(() => {
    setSearchDraft(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/branches', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.branches)
          ? data.branches
          : Array.isArray(data?.data)
            ? data.data
            : [];
        const mapped: BranchOption[] = list
          .map(
            (b: { id?: string; name?: string; slug?: string }) =>
              b?.id && b?.slug
                ? {
                    id: b.id,
                    name: b.name || b.slug,
                    slug: b.slug,
                  }
                : null
          )
          .filter(Boolean) as BranchOption[];
        const preferred = ['vermont', 'new-jersey'];
        mapped.sort((a, b) => {
          const ai = preferred.indexOf(a.slug);
          const bi = preferred.indexOf(b.slug);
          if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
        setBranches(mapped);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayBranches =
    branches.length > 0
      ? branches
      : !isBranchScoped
        ? FALLBACK_BRANCHES
        : [];

  const selectedValue =
    branchParam ||
    (displayBranches.length === 1 ? displayBranches[0].slug : '') ||
    'all';

  const scopeLabel = branchScopeLabel({
    branchParam: selectedValue === 'all' ? '' : selectedValue,
    branches: displayBranches,
    isBranchScoped,
    branchName,
  });

  useEffect(() => {
    onBranchScopeLabelChange?.(scopeLabel);
  }, [scopeLabel, onBranchScopeLabelChange]);

  const onBranchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete('branchId');
    else params.set('branchId', value);
    const qs = params.toString();
    const base = pathname.startsWith('/admin') ? pathname : '/admin/jobs';
    router.replace(qs ? `${base}?${qs}` : base);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = searchDraft.trim();
    if (q) params.set('search', q);
    if (branchParam) params.set('branchId', branchParam);
    const qs = params.toString();
    router.push(qs ? `/admin/jobs?${qs}` : '/admin/jobs');
  };

  const showBranchSelect = !isBranchScoped && displayBranches.length > 0;
  const lockedBranchLabel =
    branchName || displayBranches[0]?.name || (isOwner ? null : 'Branch');

  return (
    <header className="flex min-h-[77px] flex-col gap-3 border-b border-vm-line bg-vm-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {showBranchSelect ? (
          <>
            <label htmlFor="admin-branch" className="sr-only">
              Branch
            </label>
            <select
              id="admin-branch"
              value={selectedValue}
              onChange={(e) => onBranchChange(e.target.value)}
              className="min-h-11 rounded-[10px] border border-vm-field-border bg-vm-surface px-3 py-2.5 font-body text-sm font-semibold text-vm-text outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan"
            >
              {displayBranches.length > 1 ? (
                <option value="all">All branches</option>
              ) : null}
              {displayBranches.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </>
        ) : lockedBranchLabel ? (
          <span className="rounded-[10px] border border-vm-field-border bg-vm-surface px-3 py-2.5 font-body text-sm font-semibold text-vm-text">
            {lockedBranchLabel}
          </span>
        ) : null}

        <form
          onSubmit={onSearch}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <label htmlFor="admin-global-search" className="sr-only">
            Search jobs, properties, people
          </label>
          <input
            id="admin-global-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search jobs, properties, people"
            className="min-h-11 w-full min-w-[200px] max-w-[420px] rounded-[10px] border border-vm-field-border bg-vm-surface px-3 py-2.5 font-body text-sm text-vm-text outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan"
          />
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3.5">
        {sampleData ? (
          <span className="rounded-[7px] bg-vm-warning-bg px-2.5 py-1.5 font-body text-[11px] font-bold text-vm-warning">
            SAMPLE DATA
          </span>
        ) : null}
        <Link
          href={NEW_BOOKING_HREF}
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-[17px] py-[11px] font-heading text-sm font-semibold text-vm-white no-underline outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2"
        >
          + New booking
        </Link>
        <div className="shrink-0">{accountMenu}</div>
        {signOutError ? (
          <span className="sr-only" role="alert">
            {signOutError}
          </span>
        ) : null}
      </div>
    </header>
  );
}

export default AdminTopBar;
