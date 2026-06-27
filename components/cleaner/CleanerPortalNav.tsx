'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/cleaner/jobs', label: 'Jobs' },
  { href: '/cleaner/training', label: 'Training' },
];

export default function CleanerPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 border-b border-vm-border pb-3">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-vm-navy text-white'
                : 'bg-white text-vm-text hover:bg-gray-100 border border-vm-border'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
