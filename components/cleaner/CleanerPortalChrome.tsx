'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brandAssets } from '@/lib/brand/assets';

const NAV = [
  { href: '/cleaner/jobs', label: 'My Work', match: (p: string) => p === '/cleaner/jobs' },
  {
    href: '/cleaner/jobs',
    label: 'Offers',
    match: (p: string) => p.startsWith('/cleaner/jobs/'),
  },
  {
    href: '/cleaner/jobs',
    label: 'Assignments',
    // Shares /cleaner/jobs with My Work and Offers, so the URL never selects it.
    match: (p: string) => p === '',
  },
  {
    href: '/cleaner/earnings',
    label: 'Earnings',
    match: (p: string) => p.startsWith('/cleaner/earnings'),
  },
] as const;

export function CleanerPortalChrome({
  children,
  activeNav,
}: {
  children: React.ReactNode;
  /** Override for fixtures when pathname is /dev/... */
  activeNav?: 'My Work' | 'Offers' | 'Assignments' | 'Earnings';
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-vm-canvas font-body text-sm text-vm-text sm:max-w-lg">
      <header className="flex items-center justify-between bg-vm-navy px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandAssets.compactReversed}
          alt="VelocityMaid"
          width={150}
          height={38}
          className="h-auto w-[150px] object-contain object-left"
        />
        <span className="font-body text-sm text-vm-nav-text">Cleaner</span>
      </header>

      <main className="flex flex-1 flex-col gap-3.5 px-4 py-5">{children}</main>

      <nav
        className="flex justify-around border-t border-vm-line bg-white px-1 pb-3.5 pt-2"
        aria-label="Cleaner"
      >
        {NAV.map((item) => {
          const active =
            activeNav !== undefined
              ? item.label === activeNav
              : item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-12 min-w-[64px] items-center justify-center px-1 font-body text-sm no-underline ${
                active
                  ? 'font-extrabold text-vm-cyan-dark'
                  : 'font-medium text-vm-muted'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
